import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { simulateCombat } from '@/lib/combatSimulation';

interface HoverCombatPreviewProps {
  attackerForce: number;
  defenderForce: number;
  defenseBase: number;
  x: number;
  y: number;
  attackerColor: string;
}

export function HoverCombatPreview({ attackerForce, defenderForce, defenseBase, x, y, attackerColor }: HoverCombatPreviewProps) {
  const result = useMemo(
    () => simulateCombat(attackerForce, defenderForce, defenseBase, 100),
    [attackerForce, defenderForce, defenseBase]
  );

  const riskColor = result.riskLevel === 'low' ? '#22c55e' : result.riskLevel === 'medium' ? '#eab308' : '#ef4444';
  const riskLabel = result.riskLevel === 'low' ? 'VANTAGEM' : result.riskLevel === 'medium' ? 'EQUILIBRADO' : 'RISCO ALTO';

  // Position overlay above the territory
  const ox = x;
  const oy = y - 65;

  return (
    <motion.g
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.15 }}
    >
      {/* Background card */}
      <rect x={ox - 72} y={oy - 38} width={144} height={76} rx={8}
        fill="hsl(220, 15%, 10%)" fillOpacity={0.92} stroke={riskColor} strokeWidth={1.5} />

      {/* Risk label */}
      <rect x={ox - 36} y={oy - 38} width={72} height={14} rx={4} fill={riskColor} fillOpacity={0.25} />
      <text x={ox} y={oy - 27} textAnchor="middle" fill={riskColor}
        fontSize="8" fontFamily="Rajdhani, sans-serif" fontWeight="bold" letterSpacing="1">
        {riskLabel}
      </text>

      {/* ATK vs DEF */}
      <text x={ox - 40} y={oy - 10} textAnchor="middle" fill="#94a3b8"
        fontSize="7" fontFamily="Rajdhani, sans-serif">ATK</text>
      <text x={ox - 40} y={oy + 2} textAnchor="middle" fill={attackerColor}
        fontSize="14" fontFamily="Rajdhani, sans-serif" fontWeight="bold">{attackerForce}</text>

      <text x={ox} y={oy - 4} textAnchor="middle" fill="#64748b"
        fontSize="9" fontFamily="Rajdhani, sans-serif">⚔</text>

      <text x={ox + 40} y={oy - 10} textAnchor="middle" fill="#94a3b8"
        fontSize="7" fontFamily="Rajdhani, sans-serif">DEF</text>
      <text x={ox + 40} y={oy + 2} textAnchor="middle" fill="#ef4444"
        fontSize="14" fontFamily="Rajdhani, sans-serif" fontWeight="bold">
        {defenderForce}{defenseBase > 0 ? `+${defenseBase}` : ''}
      </text>

      {/* Probability bar */}
      <rect x={ox - 55} y={oy + 10} width={110} height={5} rx={2.5} fill="#1e293b" />
      <rect x={ox - 55} y={oy + 10} width={110 * (result.chanceVitoria / 100)} height={5} rx={2.5} fill="#22c55e" fillOpacity={0.8} />
      {result.chanceVitoria < 100 && (
        <rect x={ox - 55 + 110 * (result.chanceVitoria / 100)} y={oy + 10}
          width={110 * (result.chanceEmpate / 100)} height={5} fill="#eab308" fillOpacity={0.6} />
      )}

      {/* Win % */}
      <text x={ox - 55} y={oy + 26} textAnchor="start" fill="#22c55e"
        fontSize="8" fontFamily="Rajdhani, sans-serif" fontWeight="bold">
        ✔ {result.chanceVitoria}%
      </text>
      <text x={ox} y={oy + 26} textAnchor="middle" fill="#eab308"
        fontSize="8" fontFamily="Rajdhani, sans-serif">
        ⚔ {result.chanceEmpate}%
      </text>
      <text x={ox + 55} y={oy + 26} textAnchor="end" fill="#ef4444"
        fontSize="8" fontFamily="Rajdhani, sans-serif" fontWeight="bold">
        ✖ {result.chanceDerrota}%
      </text>

      {/* Losses */}
      <text x={ox} y={oy + 36} textAnchor="middle" fill="#64748b"
        fontSize="6.5" fontFamily="Rajdhani, sans-serif">
        Perdas: ~{result.avgAttackerLoss} suas · ~{result.avgDefenderLoss} dele
      </text>
    </motion.g>
  );
}
