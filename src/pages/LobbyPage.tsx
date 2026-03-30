import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePlayer } from '@/hooks/usePlayer';
import { FACTIONS, Faction } from '@/lib/factions';
import { TERRITORIES, PLAYER_COLORS } from '@/lib/gameConstants';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Crown, Check, ArrowLeft, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface LobbyPlayer {
  id: string;
  player_id: string;
  house: string | null;
  cor: string;
  players?: { display_name: string } | null;
}

export default function LobbyPage() {
  const { partidaId } = useParams<{ partidaId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { player } = usePlayer(user?.id);
  const [partida, setPartida] = useState<any>(null);
  const [lobbyPlayers, setLobbyPlayers] = useState<LobbyPlayer[]>([]);
  const [copied, setCopied] = useState(false);

  const fetchLobby = useCallback(async () => {
    if (!partidaId) return;
    const [p, pe] = await Promise.all([
      supabase.from('partidas').select('*').eq('id', partidaId).single(),
      supabase.from('player_estado').select('*, players(display_name)').eq('partida_id', partidaId),
    ]);
    if (p.data) setPartida(p.data);
    if (pe.data) setLobbyPlayers(pe.data as unknown as LobbyPlayer[]);
  }, [partidaId]);

  useEffect(() => { fetchLobby(); }, [fetchLobby]);

  useEffect(() => {
    if (partida?.status === 'in_progress') {
      navigate(`/game/${partidaId}`);
    }
  }, [partida?.status, partidaId, navigate]);

  useEffect(() => {
    if (!partidaId) return;
    const channel = supabase
      .channel(`lobby-${partidaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_estado', filter: `partida_id=eq.${partidaId}` }, () => fetchLobby())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partidas', filter: `id=eq.${partidaId}` }, () => fetchLobby())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [partidaId, fetchLobby]);

  const isHost = partida?.host_id === player?.id;
  const myEstado = lobbyPlayers.find(lp => lp.player_id === player?.id);
  const takenHouses = lobbyPlayers.filter(lp => lp.house).map(lp => lp.house!);
  const allReady = lobbyPlayers.length >= 2 && lobbyPlayers.every(lp => lp.house);

  const selectHouse = async (faction: Faction) => {
    if (!myEstado) return;
    if (takenHouses.includes(faction.id) && myEstado.house !== faction.id) {
      toast.error('Casa já escolhida por outro jogador');
      return;
    }
    const { error } = await (supabase.from('player_estado') as any)
      .update({ house: faction.id, cor: faction.color })
      .eq('id', myEstado.id);
    if (error) {
      console.error('SELECT_HOUSE_ERROR:', error);
      toast.error('Erro ao selecionar casa');
    }
  };

  const copyCode = () => {
    if (partida?.code) {
      navigator.clipboard.writeText(partida.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const startMatch = async () => {
    if (!partidaId || !isHost || !allReady || !player?.id) {
      toast.error('Condições não atendidas para iniciar');
      return;
    }

    try {
      // 1. Assign final colors
      for (let i = 0; i < lobbyPlayers.length; i++) {
        const lp = lobbyPlayers[i];
        const faction = FACTIONS.find(f => f.id === lp.house);
        const { error } = await (supabase.from('player_estado') as any)
          .update({ cor: faction?.color || PLAYER_COLORS[i], ativo: true })
          .eq('id', lp.id);
        if (error) {
          console.error('UPDATE_PLAYER_COLOR_ERROR:', error);
          toast.error('Erro ao configurar jogador');
          return;
        }
      }

      // 2. Set status to in_progress
      const { error: statusErr } = await supabase.from('partidas')
        .update({ status: 'in_progress' as const, turno_atual: 1 })
        .eq('id', partidaId);
      if (statusErr) {
        console.error('UPDATE_STATUS_ERROR:', statusErr);
        toast.error('Erro ao iniciar partida');
        return;
      }

      // 3. Distribute territories (don't send manual id - use auto-generated)
      const playerIds = lobbyPlayers.map(lp => lp.player_id);
      const shuffled = [...TERRITORIES].sort(() => Math.random() - 0.5);
      const terrInserts = shuffled.map((t, i) => ({
        id: t.id,
        partida_id: partidaId,
        nome: t.nome,
        dono_id: playerIds[i % playerIds.length],
        forca: 50,
        producao_spice: t.producao_spice,
        defesa_base: t.defesa_base,
        vizinhos: t.vizinhos,
        pos_x: t.pos_x,
        pos_y: t.pos_y,
        regiao: t.regiao,
        tipo: t.tipo,
      }));
      const { error: terrErr } = await supabase.from('territorios').insert(terrInserts);
      if (terrErr) {
        console.error('INSERT_TERRITORIES_ERROR:', terrErr);
        toast.error('Erro ao criar territórios: ' + terrErr.message);
        return;
      }

      // 4. Create first turn
      const { error: turnoErr } = await supabase.from('turnos').insert({ partida_id: partidaId, numero: 1 });
      if (turnoErr) {
        console.error('INSERT_TURNO_ERROR:', turnoErr);
        toast.error('Erro ao criar turno');
        return;
      }

      // 5. Game log
      const { error: logErr } = await supabase.from('game_logs').insert({
        partida_id: partidaId,
        turno_numero: 1,
        nivel: 'publico' as const,
        mensagem: `Partida iniciada com ${playerIds.length} jogadores! 20 territórios em disputa.`,
      });
      if (logErr) console.error('INSERT_LOG_ERROR:', logErr);

    } catch (err: any) {
      console.error('START_MATCH_UNEXPECTED:', err);
      toast.error('Erro inesperado ao iniciar partida');
    }
  };

  if (!partida || !player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-display text-2xl text-primary animate-pulse tracking-[0.2em]">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-display text-4xl text-primary tracking-[0.2em]">LOBBY</h1>
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-2 text-muted-foreground font-body text-sm">
              <Clock className="w-4 h-4" /> {partida.turn_time || 60}s por turno
            </div>
            <span className="text-border">•</span>
            <div className="flex items-center gap-2 text-muted-foreground font-body text-sm">
              <Users className="w-4 h-4" /> Máx {partida.max_jogadores}
            </div>
          </div>
        </div>

        <div className="border-glow rounded-lg p-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground font-body">Código da Partida</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-display text-4xl text-primary tracking-[0.4em]">{partida.code}</span>
            <Button variant="outline" size="icon" onClick={copyCode}>
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground font-body">Compartilhe este código com seus amigos</p>
        </div>

        <div className="border-glow rounded-lg p-6 space-y-4">
          <h2 className="text-display text-lg text-foreground tracking-[0.1em]">Jogadores</h2>
          <div className="space-y-2">
            {lobbyPlayers.map((lp) => {
              const faction = FACTIONS.find(f => f.id === lp.house);
              const name = (lp.players as any)?.display_name || 'Jogador';
              const isMe = lp.player_id === player.id;
              const isLobbyHost = lp.player_id === partida.host_id;
              return (
                <div
                  key={lp.id}
                  className="flex items-center justify-between p-3 rounded-md border border-border"
                  style={{ borderLeftColor: faction?.color || 'hsl(var(--border))', borderLeftWidth: '4px' }}
                >
                  <div className="flex items-center gap-3">
                    {isLobbyHost && <Crown className="w-4 h-4 text-primary" />}
                    <span className="font-body text-foreground">{name}{isMe ? ' (você)' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {faction ? (
                      <span className="text-sm font-body" style={{ color: faction.color }}>
                        {faction.symbol} {faction.name}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground font-body italic">Escolhendo casa...</span>
                    )}
                  </div>
                </div>
              );
            })}
            {Array.from({ length: (partida.max_jogadores || 4) - lobbyPlayers.length }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center p-3 rounded-md border border-dashed border-border">
                <span className="text-sm text-muted-foreground font-body italic">Aguardando jogador...</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-glow rounded-lg p-6 space-y-4">
          <h2 className="text-display text-lg text-foreground tracking-[0.1em]">Escolha sua Casa</h2>
          <div className="grid grid-cols-3 gap-3">
            <AnimatePresence>
              {FACTIONS.map(faction => {
                const taken = takenHouses.includes(faction.id);
                const isMine = myEstado?.house === faction.id;
                const disabled = taken && !isMine;
                return (
                  <motion.button
                    key={faction.id}
                    whileHover={!disabled ? { scale: 1.03 } : {}}
                    whileTap={!disabled ? { scale: 0.97 } : {}}
                    onClick={() => !disabled && selectHouse(faction)}
                    className={`relative p-3 rounded-lg border-2 text-left transition-all ${
                      isMine
                        ? 'border-primary ring-2 ring-primary/30'
                        : disabled
                        ? 'border-border opacity-40 cursor-not-allowed'
                        : 'border-border hover:border-primary/50 cursor-pointer'
                    }`}
                  >
                    <div className="text-2xl mb-1">{faction.symbol}</div>
                    <div className="font-body text-sm text-foreground font-medium truncate">{faction.name}</div>
                    <div className="font-body text-xs text-muted-foreground mt-0.5 line-clamp-1">{faction.description}</div>
                    <div className="font-body text-xs mt-1" style={{ color: faction.color }}>{faction.bonus}</div>
                    {taken && !isMine && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg">
                        <span className="text-xs font-body text-muted-foreground">Ocupada</span>
                      </div>
                    )}
                    {isMine && (
                      <div className="absolute top-1 right-1">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/')} className="font-body">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          {isHost && (
            <Button onClick={startMatch} disabled={!allReady} className="flex-1 h-12 font-display text-lg tracking-[0.15em]">
              {allReady ? 'Iniciar Partida' : `Aguardando (${lobbyPlayers.filter(lp => lp.house).length}/${lobbyPlayers.length})`}
            </Button>
          )}
          {!isHost && (
            <div className="flex-1 flex items-center justify-center text-muted-foreground font-body text-sm">
              Aguardando o host iniciar...
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
