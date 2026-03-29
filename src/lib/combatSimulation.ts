// Monte Carlo combat simulation for preview
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

    if (atkRoll > defRoll) {
      wins++;
      // Attacker wins: defender loses proportional force
      const ratio = atkRoll / (atkRoll + defRoll);
      const defLoss = Math.max(1, Math.ceil(defenderForce * ratio));
      const attLoss = Math.max(0, Math.floor(attackerForce * (1 - ratio) * 0.5));
      totalDefLoss += Math.min(defLoss, defenderForce);
      totalAttLoss += Math.min(attLoss, attackerForce - 1);
    } else if (defRoll > atkRoll) {
      losses++;
      const ratio = defRoll / (atkRoll + defRoll);
      const attLoss = Math.max(1, Math.ceil(attackerForce * ratio));
      const defLoss = Math.max(0, Math.floor(defenderForce * (1 - ratio) * 0.3));
      totalAttLoss += Math.min(attLoss, attackerForce - 1);
      totalDefLoss += Math.min(defLoss, defenderForce);
    } else {
      draws++;
      // Draw: both lose some
      const attLoss = Math.max(1, Math.floor(attackerForce * 0.3));
      const defLoss = Math.max(1, Math.floor(defenderForce * 0.3));
      totalAttLoss += attLoss;
      totalDefLoss += defLoss;
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
