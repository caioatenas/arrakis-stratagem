import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface Territory {
  id: string;
  partida_id: string;
  nome: string;
  dono_id: string | null;
  forca: number;
  producao_spice: number;
  defesa_base: number;
  vizinhos: string[];
  pos_x: number;
  pos_y: number;
}

export interface PlayerEstado {
  id: string;
  partida_id: string;
  player_id: string;
  spice: number;
  acoes_restantes: number;
  ativo: boolean;
  cor: string;
}

export interface GameLog {
  id: string;
  turno_numero: number;
  nivel: string;
  mensagem: string;
  dados: Record<string, unknown>;
  player_id: string | null;
  created_at: string;
}

export function useGameState(partidaId: string | null) {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [playerEstados, setPlayerEstados] = useState<PlayerEstado[]>([]);
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [turnoAtual, setTurnoAtual] = useState(0);
  const [turnoId, setTurnoId] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<string>('waiting');

  const fetchState = useCallback(async () => {
    if (!partidaId) return;

    const [terr, pe, partida, turno, gameLogs] = await Promise.all([
      supabase.from('territorios').select('*').eq('partida_id', partidaId),
      supabase.from('player_estado').select('*').eq('partida_id', partidaId),
      supabase.from('partidas').select('*').eq('id', partidaId).single(),
      supabase.from('turnos').select('*').eq('partida_id', partidaId).order('numero', { ascending: false }).limit(1),
      supabase.from('game_logs').select('*').eq('partida_id', partidaId).order('created_at', { ascending: false }).limit(50),
    ]);

    if (terr.data) setTerritories(terr.data as Territory[]);
    if (pe.data) setPlayerEstados(pe.data as PlayerEstado[]);
    if (partida.data) {
      setTurnoAtual(partida.data.turno_atual);
      setGameStatus(partida.data.status);
    }
    if (turno.data && turno.data.length > 0) setTurnoId(turno.data[0].id);
    if (gameLogs.data) setLogs(gameLogs.data as GameLog[]);
  }, [partidaId]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Realtime subscriptions
  useEffect(() => {
    if (!partidaId) return;

    const channel = supabase
      .channel(`game-${partidaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'territorios', filter: `partida_id=eq.${partidaId}` },
        () => fetchState()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_estado', filter: `partida_id=eq.${partidaId}` },
        () => fetchState()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partidas', filter: `id=eq.${partidaId}` },
        () => fetchState()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'turnos', filter: `partida_id=eq.${partidaId}` },
        () => fetchState()
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_logs', filter: `partida_id=eq.${partidaId}` },
        () => fetchState()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [partidaId, fetchState]);

  return { territories, playerEstados, logs, turnoAtual, turnoId, gameStatus, refetch: fetchState };
}
