import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Territory, PlayerEstado } from '@/hooks/useGameState';
import { FACTIONS } from '@/lib/factions';
import { VICTORY_TERRITORY_PCT, VICTORY_SPICE, SALARY_CYCLE_TURNS } from '@/lib/gameConstants';
import { InfoHint } from '@/components/ui/InfoHint';
import { Trophy, Target, Gem, Coins } from 'lucide-react';

interface VictoryProgressProps {
  territories: Territory[];
  playerEstados: PlayerEstado[];
  currentPlayerId: string | null;
  turnoAtual?: number;
}

export function VictoryProgress({ territories, playerEstados, currentPlayerId, turnoAtual = 0 }: VictoryProgressProps) {
  const progress = useMemo(() => {
    const total = territories.length;
    if (total === 0) return [];

    return playerEstados
      .filter(pe => pe.ativo)
      .map(pe => {
        const owned = territories.filter(t => t.dono_id === pe.player_id).length;
        const percent = Math.round((owned / total) * 100);
        const faction = pe.house ? FACTIONS.find(f => f.id === pe.house) : null;
        const totalTroops = territories
          .filter(t => t.dono_id === pe.player_id)
          .reduce((sum, t) => sum + t.forca, 0);
        const salaryCost = Math.floor(totalTroops * 0.3);
        return {
          playerId: pe.player_id,
          cor: pe.cor,
          percent,
          owned,
          spice: pe.spice,
          faction,
          isMe: pe.player_id === currentPlayerId,
          salaryCost,
          totalTroops,
          canPay: pe.spice >= salaryCost,
        };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [territories, playerEstados, currentPlayerId]);

  const turnsUntilSalary = SALARY_CYCLE_TURNS - (turnoAtual % SALARY_CYCLE_TURNS);
  const isSalaryNext = turnsUntilSalary === 1;

  if (progress.length === 0) return null;

  const totalTerr = territories.length;

  return (
    <div className="border-glow rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-primary" />
        <h3 className="text-display text-primary text-sm tracking-wider">DOMÍNIO</h3>
        <InfoHint title="CONDIÇÕES DE VITÓRIA" side="bottom">
          <p>🏆 Controlar <strong>{VICTORY_TERRITORY_PCT}% dos territórios</strong>.</p>
          <p>💰 Acumular <strong>{VICTORY_SPICE} spice</strong>.</p>
          <p>⚔ Ser o <strong>último jogador ativo</strong> (todos os outros eliminados).</p>
          <p className="text-muted-foreground italic">A condição é checada ao final de cada turno.</p>
        </InfoHint>
      </div>

      {/* Territory bar */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-body">
          <Target className="w-3 h-3" />
          <span>Territórios ({VICTORY_TERRITORY_PCT}% = vitória)</span>
        </div>
        <div className="relative h-5 rounded-full overflow-hidden bg-secondary/50 flex">
          {progress.map((p) => (
            <motion.div
              key={p.playerId}
              initial={{ width: 0 }}
              animate={{ width: `${p.percent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full relative group"
              style={{ backgroundColor: p.cor }}
            >
              {p.percent >= 12 && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md font-body">
                  {p.faction?.symbol} {p.percent}%
                </span>
              )}
            </motion.div>
          ))}
        </div>
        <div className="relative h-1">
          <div
            className="absolute top-0 w-px h-3 bg-primary -translate-y-1"
            style={{ left: `${VICTORY_TERRITORY_PCT}%` }}
          />
          <span
            className="absolute -translate-y-3 text-[8px] text-primary font-body"
            style={{ left: `${VICTORY_TERRITORY_PCT}%`, transform: 'translateX(-50%) translateY(-12px)' }}
          >
            {VICTORY_TERRITORY_PCT}%
          </span>
        </div>
      </div>

      {/* Salary indicator */}
      <div className={`flex items-center gap-2 text-xs font-body rounded px-2 py-1.5 ${isSalaryNext ? 'bg-destructive/15 border border-destructive/30' : 'bg-secondary/30'}`}>
        <Coins className={`w-3.5 h-3.5 ${isSalaryNext ? 'text-destructive' : 'text-muted-foreground'}`} />
        <span className={isSalaryNext ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
          Pagamento em {turnsUntilSalary} turno{turnsUntilSalary > 1 ? 's' : ''}
        </span>
        {progress.find(p => p.isMe) && (
          <span className="ml-auto text-spice font-semibold">
            ~{progress.find(p => p.isMe)?.salaryCost} ⟡
          </span>
        )}
      </div>

      {/* Player details */}
      <div className="space-y-1">
        {progress.map(p => (
          <div key={p.playerId} className="flex items-center gap-2 text-xs font-body">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.cor }} />
            <span className={`flex-1 ${p.isMe ? 'text-primary font-semibold' : 'text-foreground'}`}>
              {p.faction?.symbol} {p.isMe ? 'Você' : (p.faction?.name || '???')}
            </span>
            <span className="text-muted-foreground">{p.owned}/{totalTerr}</span>
            <span className="text-spice flex items-center gap-0.5">
              <Gem className="w-3 h-3" /> {p.spice}/{VICTORY_SPICE}
            </span>
          </div>
        ))}
      </div>

      {/* Salary warning for current player */}
      {isSalaryNext && progress.find(p => p.isMe && !p.canPay) && (
        <div className="bg-destructive/10 border border-destructive/30 rounded px-2 py-1.5 text-[10px] text-destructive font-body">
          ⚠️ Spice insuficiente! Tropas desertarão no próximo pagamento.
        </div>
      )}

      {/* Victory conditions */}
      <div className="border-t border-border pt-2 text-[10px] text-muted-foreground font-body space-y-0.5">
        <p>🏆 {VICTORY_TERRITORY_PCT}% territórios = vitória</p>
        <p>💰 {VICTORY_SPICE} spice = vitória</p>
        <p>⚔ Último jogador ativo = vitória</p>
      </div>
    </div>
  );
}
