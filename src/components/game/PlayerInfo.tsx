import type { PlayerEstado } from '@/hooks/useGameState';
import type { Player } from '@/hooks/usePlayer';

interface PlayerInfoProps {
  player: Player | null;
  estado: PlayerEstado | null;
  turnoAtual: number;
  allEstados: PlayerEstado[];
  allPlayers?: Player[];
}

export function PlayerInfo({ player, estado, turnoAtual, allEstados }: PlayerInfoProps) {
  return (
    <div className="border-glow rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div
          className="w-4 h-4 rounded-full border border-border"
          style={{ backgroundColor: estado?.cor || '#555' }}
        />
        <h3 className="text-display text-primary text-lg">{player?.display_name || 'Jogador'}</h3>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-secondary/50 rounded p-2">
          <div className="text-xs text-muted-foreground font-body">Turno</div>
          <div className="text-lg text-foreground font-bold font-body">{turnoAtual}</div>
        </div>
        <div className="bg-secondary/50 rounded p-2">
          <div className="text-xs text-muted-foreground font-body">Spice</div>
          <div className="text-lg text-spice font-bold font-body">{estado?.spice ?? 0}</div>
        </div>
        <div className="bg-secondary/50 rounded p-2">
          <div className="text-xs text-muted-foreground font-body">Ações</div>
          <div className="text-lg text-primary font-bold font-body">{estado?.acoes_restantes ?? 0}</div>
        </div>
      </div>

      {/* Other players */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground font-body">Jogadores:</p>
        {allEstados.map(pe => (
          <div key={pe.id} className="flex items-center gap-2 text-xs font-body">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pe.cor }} />
            <span className={pe.ativo ? 'text-foreground' : 'text-muted-foreground line-through'}>
              {pe.player_id === player?.id ? 'Você' : pe.player_id.slice(0, 8)}
            </span>
            <span className="text-spice ml-auto">⟡ {pe.spice}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
