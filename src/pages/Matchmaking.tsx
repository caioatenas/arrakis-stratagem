import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePlayer } from '@/hooks/usePlayer';
import { TERRITORIES, PLAYER_COLORS } from '@/lib/gameConstants';
import { motion } from 'framer-motion';
import { Loader2, LogOut, Users } from 'lucide-react';

export default function Matchmaking() {
  const { user, signOut } = useAuth();
  const { player } = usePlayer(user?.id);
  const navigate = useNavigate();
  const [inQueue, setInQueue] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [searching, setSearching] = useState(false);

  // Check queue count
  useEffect(() => {
    const fetchQueue = async () => {
      const { count } = await supabase
        .from('matchmaking_queue')
        .select('*', { count: 'exact', head: true });
      setQueueCount(count || 0);
    };
    fetchQueue();

    const channel = supabase
      .channel('queue-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matchmaking_queue' }, () => fetchQueue())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Check if already in a game
  useEffect(() => {
    if (!player) return;
    const checkActiveGame = async () => {
      const { data } = await supabase
        .from('player_estado')
        .select('partida_id, partidas(status)')
        .eq('player_id', player.id)
        .eq('ativo', true);

      if (data && data.length > 0) {
        const active = data.find((d: any) => d.partidas?.status === 'in_progress');
        if (active) {
          navigate(`/game/${active.partida_id}`);
        }
      }
    };
    checkActiveGame();
  }, [player, navigate]);

  // Listen for match creation
  useEffect(() => {
    if (!player || !inQueue) return;

    const channel = supabase
      .channel('match-created')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'player_estado', filter: `player_id=eq.${player.id}` },
        (payload: any) => {
          if (payload.new?.partida_id) {
            navigate(`/game/${payload.new.partida_id}`);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [player, inQueue, navigate]);

  const joinQueue = async () => {
    if (!player) return;
    setSearching(true);

    // Add to queue
    await supabase.from('matchmaking_queue').upsert({ player_id: player.id });
    setInQueue(true);

    // Check if enough players (2+ for now, can be 4)
    const { data: queuePlayers } = await supabase
      .from('matchmaking_queue')
      .select('player_id')
      .order('joined_at', { ascending: true })
      .limit(4);

    if (queuePlayers && queuePlayers.length >= 2) {
      await createMatch(queuePlayers.map(q => q.player_id));
    }
  };

  const createMatch = async (playerIds: string[]) => {
    // Create partida
    const { data: partida } = await supabase
      .from('partidas')
      .insert({ status: 'in_progress', turno_atual: 1, max_jogadores: playerIds.length })
      .select()
      .single();

    if (!partida) return;

    // Create player estados
    const estados = playerIds.map((pid, i) => ({
      partida_id: partida.id,
      player_id: pid,
      spice: 0,
      acoes_restantes: 2,
      cor: PLAYER_COLORS[i % PLAYER_COLORS.length],
    }));
    await supabase.from('player_estado').insert(estados);

    // Distribute territories
    const shuffledTerritories = [...TERRITORIES].sort(() => Math.random() - 0.5);
    const terrInserts = shuffledTerritories.map((t, i) => ({
      id: t.id,
      partida_id: partida.id,
      nome: t.nome,
      dono_id: playerIds[i % playerIds.length],
      forca: 50,
      producao_spice: t.producao_spice,
      defesa_base: t.defesa_base,
      vizinhos: t.vizinhos,
      pos_x: t.pos_x,
      pos_y: t.pos_y,
    }));
    await supabase.from('territorios').insert(terrInserts);

    // Create first turn
    await supabase.from('turnos').insert({
      partida_id: partida.id,
      numero: 1,
    });

    // Remove from queue
    await supabase.from('matchmaking_queue').delete().in('player_id', playerIds);

    // Log
    await supabase.from('game_logs').insert({
      partida_id: partida.id,
      turno_numero: 1,
      nivel: 'publico',
      mensagem: `Partida iniciada com ${playerIds.length} jogadores!`,
    });

    navigate(`/game/${partida.id}`);
  };

  const leaveQueue = async () => {
    if (!player) return;
    await supabase.from('matchmaking_queue').delete().eq('player_id', player.id);
    setInQueue(false);
    setSearching(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg space-y-8 text-center"
      >
        <div className="space-y-2">
          <h1 className="text-display text-5xl text-primary tracking-[0.25em]">ARRAKIS</h1>
          <p className="text-muted-foreground font-body text-lg">Guerra pela Especiaria</p>
        </div>

        <div className="border-glow rounded-lg p-8 space-y-6">
          <div className="flex items-center justify-center gap-2 text-sand">
            <Users className="w-5 h-5" />
            <span className="font-body text-lg">{queueCount} na fila</span>
          </div>

          {!inQueue ? (
            <Button
              onClick={joinQueue}
              disabled={!player}
              className="w-full h-14 text-lg font-display tracking-[0.15em]"
            >
              Encontrar Partida
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="font-body text-foreground text-lg">Procurando oponentes...</span>
              </div>
              <Button
                onClick={leaveQueue}
                variant="outline"
                className="font-body"
              >
                Cancelar
              </Button>
            </div>
          )}

          {player && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground font-body">
                Jogando como <span className="text-primary">{player.display_name}</span>
              </p>
              <p className="text-xs text-muted-foreground font-body mt-1">
                Vitórias: {player.games_won} | Partidas: {player.games_played}
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={signOut}
          variant="ghost"
          size="sm"
          className="text-muted-foreground font-body"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </motion.div>
    </div>
  );
}
