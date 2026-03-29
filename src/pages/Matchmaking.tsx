import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePlayer } from '@/hooks/usePlayer';
import { motion } from 'framer-motion';
import { LogOut, Plus, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function Matchmaking() {
  const { user, signOut } = useAuth();
  const { player } = usePlayer(user?.id);
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [turnTime, setTurnTime] = useState(60);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!player) return;
    setLoading(true);
    const code = generateCode();
    const { data, error } = await supabase
      .from('partidas')
      .insert({
        status: 'waiting' as const,
        turno_atual: 0,
        max_jogadores: maxPlayers,
        code,
        host_id: player.id,
        turn_time: turnTime,
        map: 'arrakis',
      })
      .select()
      .single();

    if (error || !data) {
      toast.error('Erro ao criar partida');
      setLoading(false);
      return;
    }

    // Host joins as first player
    await supabase.from('player_estado').insert({
      partida_id: data.id,
      player_id: player.id,
      spice: 0,
      acoes_restantes: 2,
      cor: '#C4A35A',
    });

    setLoading(false);
    navigate(`/lobby/${data.id}`);
  };

  const handleJoin = async () => {
    if (!player || !joinCode.trim()) return;
    setLoading(true);
    const { data: partida } = await supabase
      .from('partidas')
      .select('*')
      .eq('code', joinCode.trim().toUpperCase())
      .single();

    if (!partida || partida.status !== 'waiting') {
      toast.error('Partida inválida ou já iniciada');
      setLoading(false);
      return;
    }

    // Check if already joined
    const { data: existing } = await supabase
      .from('player_estado')
      .select('id')
      .eq('partida_id', partida.id)
      .eq('player_id', player.id);

    if (existing && existing.length > 0) {
      setLoading(false);
      navigate(`/lobby/${partida.id}`);
      return;
    }

    // Check player count
    const { count } = await supabase
      .from('player_estado')
      .select('*', { count: 'exact', head: true })
      .eq('partida_id', partida.id);

    if ((count || 0) >= partida.max_jogadores) {
      toast.error('Partida lotada');
      setLoading(false);
      return;
    }

    await supabase.from('player_estado').insert({
      partida_id: partida.id,
      player_id: player.id,
      spice: 0,
      acoes_restantes: 2,
      cor: '#C4A35A',
    });

    setLoading(false);
    navigate(`/lobby/${partida.id}`);
  };

  const turnOptions = [30, 60, 90, 120, 180];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-display text-5xl text-primary tracking-[0.25em]">ARRAKIS</h1>
          <p className="text-muted-foreground font-body text-lg">Guerra pela Especiaria</p>
        </div>

        {!showCreate && !showJoin && (
          <div className="border-glow rounded-lg p-8 space-y-4">
            <Button onClick={() => setShowCreate(true)} disabled={!player} className="w-full h-14 text-lg font-display tracking-[0.15em]">
              <Plus className="w-5 h-5 mr-2" /> Criar Partida
            </Button>
            <Button onClick={() => setShowJoin(true)} disabled={!player} variant="outline" className="w-full h-14 text-lg font-display tracking-[0.15em]">
              <KeyRound className="w-5 h-5 mr-2" /> Entrar com Código
            </Button>
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
        )}

        {showCreate && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border-glow rounded-lg p-8 space-y-6 text-left">
            <h2 className="text-display text-2xl text-primary tracking-[0.1em] text-center">Configurar Partida</h2>

            <div className="space-y-2">
              <label className="text-sm font-body text-muted-foreground">Tempo por turno</label>
              <div className="flex gap-2 flex-wrap">
                {turnOptions.map(t => (
                  <Button key={t} variant={turnTime === t ? 'default' : 'outline'} size="sm" onClick={() => setTurnTime(t)} className="font-body">
                    {t}s
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-body text-muted-foreground">Jogadores (máx)</label>
              <div className="flex gap-2">
                {[2, 3, 4].map(n => (
                  <Button key={n} variant={maxPlayers === n ? 'default' : 'outline'} size="sm" onClick={() => setMaxPlayers(n)} className="font-body">
                    {n}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-body text-muted-foreground">Mapa</label>
              <div className="flex gap-2">
                <Button variant="default" size="sm" className="font-body" disabled>Arrakis (Padrão)</Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setShowCreate(false)} variant="outline" className="flex-1 font-body">Voltar</Button>
              <Button onClick={handleCreate} disabled={loading} className="flex-1 font-body">
                {loading ? 'Criando...' : 'Criar Partida'}
              </Button>
            </div>
          </motion.div>
        )}

        {showJoin && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border-glow rounded-lg p-8 space-y-6">
            <h2 className="text-display text-2xl text-primary tracking-[0.1em]">Entrar na Partida</h2>
            <Input
              placeholder="Código da partida (ex: A7K9XZ)"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-2xl tracking-[0.3em] font-display h-14"
            />
            <div className="flex gap-3">
              <Button onClick={() => { setShowJoin(false); setJoinCode(''); }} variant="outline" className="flex-1 font-body">Voltar</Button>
              <Button onClick={handleJoin} disabled={loading || joinCode.length < 6} className="flex-1 font-body">
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </div>
          </motion.div>
        )}

        <Button onClick={signOut} variant="ghost" size="sm" className="text-muted-foreground font-body">
          <LogOut className="w-4 h-4 mr-2" /> Sair
        </Button>
      </motion.div>
    </div>
  );
}
