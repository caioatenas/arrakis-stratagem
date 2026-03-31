// Monte Carlo combat simulation for preview
// Uses 0.6x damage multiplier to match backend
export interface CombatPreviewResult {
  chanceVitoria: number;
  chanceDerrota: number;
  chanceEmpate: number;
  avgAttackerLoss: number;
  avgDefenderLoss: number;
  avgAttackerRemaining: number;
  avgDefenderRemaining: number;
  riskLevel: 'low' | 'medium' | 'high';
}

const COMBAT_DAMAGE_MULT = 0.6;

function d10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

export function simulateCombat(
  attackerForce: number,
  defenderForce: number,
  defenseBase: number,
  simulations = 200
): CombatPreviewResult {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let totalAttLoss = 0;
  let totalDefLoss = 0;

  for (let i = 0; i < simulations; i++) {
    const atkRoll = attackerForce + d10();
    const defRoll = defenderForce + d10() + defenseBase;
    const rawResult = atkRoll - defRoll;
    const resultado = Math.round(rawResult * COMBAT_DAMAGE_MULT);

    if (resultado > 0) {
      wins++;
      // Victory: attacker loses 70% of force, defender conquered
      const attLoss = Math.max(0, Math.floor(attackerForce * 0.7));
      totalAttLoss += attLoss;
      totalDefLoss += defenderForce;
    } else if (resultado < 0) {
      losses++;
      // Defeat: defender loses dampened damage
      const defLoss = Math.abs(resultado);
      totalAttLoss += 0;
      totalDefLoss += Math.min(defLoss, defenderForce);
    } else {
      draws++;
      totalAttLoss += 6;
      totalDefLoss += 6;
    }
  }

  const chanceVitoria = Math.round((wins / simulations) * 100);
  const chanceDerrota = Math.round((losses / simulations) * 100);
  const chanceEmpate = 100 - chanceVitoria - chanceDerrota;
  const avgAttackerLoss = Math.round(totalAttLoss / simulations);
  const avgDefenderLoss = Math.round(totalDefLoss / simulations);

  let riskLevel: 'low' | 'medium' | 'high';
  if (chanceVitoria > 70) riskLevel = 'low';
  else if (chanceVitoria >= 40) riskLevel = 'medium';
  else riskLevel = 'high';

  return {
    chanceVitoria,
    chanceDerrota,
    chanceEmpate,
    avgAttackerLoss,
    avgDefenderLoss,
    avgAttackerRemaining: Math.max(1, attackerForce - avgAttackerLoss),
    avgDefenderRemaining: Math.max(0, defenderForce - avgDefenderLoss),
    riskLevel,
  };
}
