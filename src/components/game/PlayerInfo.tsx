import type { PlayerEstado } from '@/hooks/useGameState';
import type { Player } from '@/hooks/usePlayer';
import { FACTIONS } from '@/lib/factions';
import { SALARY_CYCLE_TURNS } from '@/lib/gameConstants';
import { InfoHint } from '@/components/ui/InfoHint';
import { Coins } from 'lucide-react';

interface PlayerInfoProps {
  player: Player | null;
  estado: PlayerEstado | null;
  turnoAtual: number;
  allEstados: PlayerEstado[];
  territories?: { dono_id: string | null; forca: number }[];
}

export function PlayerInfo({ player, estado, turnoAtual, allEstados, territories = [] }: PlayerInfoProps) {
  const turnsUntilSalary = SALARY_CYCLE_TURNS - (turnoAtual % SALARY_CYCLE_TURNS);
  const myTroops = territories
    .filter(t => t.dono_id === player?.id)
    .reduce((sum, t) => sum + t.forca, 0);
  const salaryCost = Math.floor(myTroops * 0.3);

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
          <div className="text-xs text-muted-foreground font-body flex items-center justify-center gap-1">
            Turno
            <InfoHint title="CICLO DE TURNOS">
              <p>Turnos são <strong>simultâneos</strong>. Todos os jogadores enviam ações ao mesmo tempo.</p>
              <p>O servidor resolve automaticamente quando todos confirmam ou o tempo acaba.</p>
              <p className="text-spice">Salário a cada {SALARY_CYCLE_TURNS} turnos — próximo em {turnsUntilSalary}.</p>
            </InfoHint>
          </div>
          <div className="text-lg text-foreground font-bold font-body">{turnoAtual}</div>
        </div>
        <div className="bg-secondary/50 rounded p-2">
          <div className="text-xs text-muted-foreground font-body flex items-center justify-center gap-1">
            Spice
            <InfoHint title="ECONOMIA DE SPICE">
              <p>Spice é a moeda de Arrakis. Você o usa para pagar tropas.</p>
              <p>A cada <strong>{SALARY_CYCLE_TURNS} turnos</strong>, você paga ~30% do total de tropas em spice.</p>
              <p className="text-destructive">Sem spice = deserção: tropas abandonam seus territórios.</p>
              <p className="text-spice">Acumular 800 spice é uma condição de vitória.</p>
            </InfoHint>
          </div>
          <div className="text-lg text-spice font-bold font-body">{estado?.spice ?? 0}</div>
        </div>
        <div className="bg-secondary/50 rounded p-2">
          <div className="text-xs text-muted-foreground font-body flex items-center justify-center gap-1">
            Ações
            <InfoHint title="AÇÕES POR TURNO">
              <p>Cada ação (mover, atacar, fortificar, espionar, extrair) consome <strong>1 ação</strong>.</p>
              <p>Use todas antes de resolver o turno — ações não usadas são perdidas.</p>
            </InfoHint>
          </div>
          <div className="text-lg text-primary font-bold font-body">{estado?.acoes_restantes ?? 0}</div>
        </div>
      </div>

      {/* Salary preview */}
      <div className="bg-secondary/30 rounded px-3 py-2 flex items-center gap-2 text-xs font-body">
        <Coins className="w-3.5 h-3.5 text-muted-foreground" />
        <div className="flex-1">
          <span className="text-muted-foreground">Salário em {turnsUntilSalary}t: </span>
          <span className={`font-semibold ${(estado?.spice ?? 0) < salaryCost ? 'text-destructive' : 'text-spice'}`}>
            {salaryCost} ⟡
          </span>
        </div>
        <span className="text-muted-foreground">{myTroops} tropas</span>
      </div>

      {/* Other players */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground font-body">Jogadores:</p>
      {allEstados.map(pe => {
          const faction = pe.house ? FACTIONS.find(f => f.id === pe.house) : null;
          return (
            <div key={pe.id} className="flex items-center gap-2 text-xs font-body">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pe.cor }} />
              <span className={pe.ativo ? 'text-foreground' : 'text-muted-foreground line-through'}>
                {faction?.symbol} {pe.player_id === player?.id ? 'Você' : (faction?.name || pe.player_id.slice(0, 8))}
              </span>
              <span className="text-spice ml-auto">⟡ {pe.spice}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
