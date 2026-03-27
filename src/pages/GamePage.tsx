import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePlayer } from '@/hooks/usePlayer';
import { useGameState } from '@/hooks/useGameState';
import { TerritoryMap } from '@/components/game/TerritoryMap';
import { ActionPanel } from '@/components/game/ActionPanel';
import { GameLog } from '@/components/game/GameLog';
import { PlayerInfo } from '@/components/game/PlayerInfo';
import { ResolveTurnButton } from '@/components/game/ResolveTurnButton';
import { motion } from 'framer-motion';
import { Tutorial } from '@/components/game/Tutorial';

export default function GamePage() {
  const { partidaId } = useParams<{ partidaId: string }>();
  const { user } = useAuth();
  const { player } = usePlayer(user?.id);
  const { territories, playerEstados, logs, turnoAtual, turnoId, gameStatus, refetch } = useGameState(partidaId || null);
  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null);

  const myEstado = playerEstados.find(pe => pe.player_id === player?.id) || null;

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
      {/* Header */}
      <header className="border-b border-border px-4 py-2 flex items-center justify-between">
        <h1 className="text-display text-xl text-primary tracking-[0.15em]">ARRAKIS</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground font-body">Turno {turnoAtual}</span>
          <ResolveTurnButton
            partidaId={partidaId || null}
            turnoId={turnoId}
            turnoAtual={turnoAtual}
            onResolved={refetch}
          />
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        {/* Map */}
        <div className="flex-1 min-h-0">
          <TerritoryMap
            territories={territories}
            playerEstados={playerEstados}
            selectedTerritory={selectedTerritory}
            onSelectTerritory={setSelectedTerritory}
            currentPlayerId={player?.id || null}
          />
        </div>

        {/* Side panel */}
        <div className="w-full lg:w-80 space-y-4">
          <PlayerInfo
            player={player || null}
            estado={myEstado}
            turnoAtual={turnoAtual}
            allEstados={playerEstados}
          />

          <ActionPanel
            selectedTerritory={selectedTerritory}
            territories={territories}
            playerEstado={myEstado}
            playerId={player?.id || null}
            partidaId={partidaId || null}
            turnoId={turnoId}
            onAction={refetch}
          />

          <GameLog logs={logs} />
        </div>
      </div>
    </div>
  );
}
