import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePlayer } from '@/hooks/usePlayer';
import { useGameState } from '@/hooks/useGameState';
import { useMovementFlow } from '@/hooks/useMovementFlow';
import { TerritoryMap } from '@/components/game/TerritoryMap';
import { ActionPanel } from '@/components/game/ActionPanel';
import { GameLog } from '@/components/game/GameLog';
import { PlayerInfo } from '@/components/game/PlayerInfo';
import { ResolveTurnButton } from '@/components/game/ResolveTurnButton';
import { motion } from 'framer-motion';
import { Tutorial } from '@/components/game/Tutorial';
import { MapLegend } from '@/components/game/map/MapLegend';
import { WormEventOverlay, type WormEventData } from '@/components/game/WormEventOverlay';
import { VictoryProgress } from '@/components/game/VictoryProgress';
import { TurnAnimationQueue } from '@/components/game/TurnAnimationQueue';
import { supabase } from '@/integrations/supabase/client';

export default function GamePage() {
  const { partidaId } = useParams<{ partidaId: string }>();
  const { user } = useAuth();
  const { player } = usePlayer(user?.id);
  const { territories, playerEstados, logs, turnoAtual, turnoId, gameStatus, refetch } = useGameState(partidaId || null);
  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null);
  const { flow, selectOrigin, selectAction, setQuantity, confirmQuantity, selectDestination, startAnimation, reset } = useMovementFlow();
  const [wormEvent, setWormEvent] = useState<WormEventData | null>(null);
  const [wormExplosionTarget, setWormExplosionTarget] = useState<string | null>(null);

  const myEstado = playerEstados.find(pe => pe.player_id === player?.id) || null;

  const handleSelectTerritory = useCallback((id: string) => {
    if (flow.state === 'quantity_selected') {
      const originTerr = territories.find(t => t.id === flow.originId);
      const destTerr = territories.find(t => t.id === id);
      if (!originTerr || !destTerr || !originTerr.vizinhos.includes(id)) return;

      if (flow.actionType === 'atacar') {
        if (destTerr.dono_id && destTerr.dono_id !== player?.id) {
          selectDestination(id);
        }
      } else {
        if (!destTerr.dono_id || destTerr.dono_id === player?.id) {
          selectDestination(id);
        }
      }
      return;
    }
    setSelectedTerritory(id);
  }, [flow.state, flow.originId, flow.actionType, territories, player?.id, selectDestination]);

  const handleStartMove = useCallback(() => {
    if (!selectedTerritory) return;
    const terr = territories.find(t => t.id === selectedTerritory);
    if (!terr || terr.dono_id !== player?.id) return;
    selectOrigin(selectedTerritory, terr.forca);
    selectAction('mover');
  }, [selectedTerritory, territories, player?.id, selectOrigin, selectAction]);

  const handleStartAttack = useCallback(() => {
    if (!selectedTerritory) return;
    const terr = territories.find(t => t.id === selectedTerritory);
    if (!terr || terr.dono_id !== player?.id) return;
    selectOrigin(selectedTerritory, terr.forca);
    selectAction('atacar');
  }, [selectedTerritory, territories, player?.id, selectOrigin, selectAction]);

  const handleConfirmMove = useCallback(async () => {
    if (!flow.originId || !flow.destinationId || !turnoId || !player?.id || !partidaId) return;
    startAnimation();

    await supabase.from('acoes').insert({
      turno_id: turnoId,
      player_id: player.id,
      partida_id: partidaId,
      tipo: (flow.actionType || 'mover') as 'mover' | 'atacar',
      origem_id: flow.originId,
      destino_id: flow.destinationId,
      quantidade: flow.quantity,
    });

    setTimeout(() => {
      reset();
      setSelectedTerritory(null);
      refetch();
    }, 900);
  }, [flow, turnoId, player?.id, partidaId, myEstado, startAnimation, reset, refetch]);

  const handleCancelMove = useCallback(() => {
    reset();
  }, [reset]);

  const getPlayerColor = useCallback((playerId: string | null) => {
    if (!playerId) return '#555';
    const pe = playerEstados.find(p => p.player_id === playerId);
    return pe?.cor || '#555';
  }, [playerEstados]);

  const handleTurnResolved = useCallback((wormData?: WormEventData) => {
    if (wormData) {
      setWormEvent(wormData);
      if (wormData.activated && wormData.targetId) {
        // Show explosion on map after overlay dismisses
        setTimeout(() => {
          setWormExplosionTarget(wormData.targetId || null);
          setTimeout(() => setWormExplosionTarget(null), 1200);
        }, 4500);
      }
    }
    refetch();
  }, [refetch]);

  const handleWormOverlayComplete = useCallback(() => {
    setWormEvent(null);
  }, []);

  if (gameStatus === 'finished') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center space-y-4">
          <h1 className="text-display text-5xl text-primary tracking-[0.2em]">PARTIDA ENCERRADA</h1>
          <p className="text-foreground font-body text-xl">A guerra terminou.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-4 py-2 flex items-center justify-between">
        <h1 className="text-display text-xl text-primary tracking-[0.15em]">ARRAKIS</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground font-body">Turno {turnoAtual}</span>
          <ResolveTurnButton partidaId={partidaId || null} turnoId={turnoId} turnoAtual={turnoAtual} onResolved={handleTurnResolved} />
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        <div className="flex-1 min-h-0">
          <TerritoryMap
            territories={territories}
            playerEstados={playerEstados}
            selectedTerritory={selectedTerritory}
            onSelectTerritory={handleSelectTerritory}
            currentPlayerId={player?.id || null}
            movementFlow={flow}
            playerColor={getPlayerColor(player?.id || null)}
            onAnimationComplete={() => {}}
            wormExplosionTarget={wormExplosionTarget}
          />
        </div>

        <div className="w-full lg:w-80 space-y-4 overflow-y-auto max-h-[calc(100vh-80px)]">
          <VictoryProgress territories={territories} playerEstados={playerEstados} currentPlayerId={player?.id || null} turnoAtual={turnoAtual} />
          <PlayerInfo player={player || null} estado={myEstado} turnoAtual={turnoAtual} allEstados={playerEstados} territories={territories} />
          <ActionPanel
            selectedTerritory={selectedTerritory}
            territories={territories}
            playerEstado={myEstado}
            playerId={player?.id || null}
            partidaId={partidaId || null}
            turnoId={turnoId}
            onAction={refetch}
            onStartAttack={handleStartAttack}
            movementFlow={flow}
            onStartMove={handleStartMove}
            onSetQuantity={setQuantity}
            onConfirmQuantity={confirmQuantity}
            onSelectDestination={selectDestination}
            onConfirmMove={handleConfirmMove}
            onCancelMove={handleCancelMove}
          />
          <GameLog logs={logs} />
          <MapLegend playerEstados={playerEstados} />
        </div>
      </div>

      <Tutorial />
      <WormEventOverlay event={wormEvent} onComplete={handleWormOverlayComplete} />
      <TurnAnimationQueue logs={logs} turnoAtual={turnoAtual} />
    </div>
  );
}
