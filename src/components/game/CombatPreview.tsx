import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Swords, Shield, Target, Check, X, Skull, Trophy, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { simulateCombat, type CombatPreviewResult } from '@/lib/combatSimulation';
import type { Territory } from '@/hooks/useGameState';

interface CombatPreviewProps {
  origin: Territory;
  target: Territory;
  attackerTroops: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const RISK_CONFIG = {
  low: { label: 'Alta chance de vitória', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: Trophy },
  medium: { label: 'Risco moderado', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: Scale },
  high: { label: 'Alto risco', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: Skull },
};

function ProbabilityBar({ result }: { result: CombatPreviewResult }) {
  return (
    <div className="space-y-1.5">
      <div className="flex h-3 rounded-full overflow-hidden border border-border/50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${result.chanceVitoria}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-green-500/80 relative"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${result.chanceEmpate}%` }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          className="bg-yellow-500/60"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${result.chanceDerrota}%` }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          className="bg-red-500/70"
        />
      </div>
      <div className="flex justify-between text-[10px] font-body">
        <span className="flex items-center gap-1 text-green-400">
          <Trophy className="w-2.5 h-2.5" /> {result.chanceVitoria}%
        </span>
        <span className="flex items-center gap-1 text-yellow-400">
          <Scale className="w-2.5 h-2.5" /> {result.chanceEmpate}%
        </span>
        <span className="flex items-center gap-1 text-red-400">
          <Skull className="w-2.5 h-2.5" /> {result.chanceDerrota}%
        </span>
      </div>
    </div>
  );
}

export function CombatPreview({ origin, target, attackerTroops, onConfirm, onCancel }: CombatPreviewProps) {
  const result = useMemo(
    () => simulateCombat(attackerTroops, target.forca, target.defesa_base, 200),
    [attackerTroops, target.forca, target.defesa_base]
  );

  const risk = RISK_CONFIG[result.riskLevel];
  const RiskIcon = risk.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-3"
    >
      {/* Header */}
      <div className={`${risk.bg} ${risk.border} border rounded-lg p-2.5`}>
        <div className="flex items-center justify-center gap-2">
          <RiskIcon className={`w-4 h-4 ${risk.color}`} />
          <span className={`text-xs font-display tracking-wider ${risk.color}`}>{risk.label}</span>
        </div>
      </div>

      {/* Combat summary */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        {/* Attacker */}
        <div className="bg-secondary/30 rounded-lg p-2 text-center space-y-1">
          <Swords className="w-4 h-4 text-primary mx-auto" />
          <p className="text-[10px] text-muted-foreground font-body">Atacante</p>
          <p className="text-xs font-body text-foreground truncate">{origin.nome}</p>
          <p className="text-lg font-bold text-primary">{attackerTroops}</p>
        </div>

        <div className="flex flex-col items-center gap-1">
          <Target className="w-5 h-5 text-destructive" />
          <span className="text-[10px] text-muted-foreground">VS</span>
        </div>

        {/* Defender */}
        <div className="bg-secondary/30 rounded-lg p-2 text-center space-y-1">
          <Shield className="w-4 h-4 text-destructive mx-auto" />
          <p className="text-[10px] text-muted-foreground font-body">Defensor</p>
          <p className="text-xs font-body text-foreground truncate">{target.nome}</p>
          <p className="text-lg font-bold text-destructive">{target.forca}</p>
          {target.defesa_base > 0 && (
            <p className="text-[10px] text-muted-foreground">+{target.defesa_base} defesa</p>
          )}
        </div>
      </div>

      {/* Probability bar */}
      <ProbabilityBar result={result} />

      {/* Expected losses */}
      <div className="bg-secondary/20 rounded-lg p-2 space-y-1.5 text-xs font-body">
        <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Perdas estimadas</p>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Suas perdas:</span>
          <span className="text-red-400 font-semibold">~{result.avgAttackerLoss} tropas</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Perdas inimigas:</span>
          <span className="text-green-400 font-semibold">~{result.avgDefenderLoss} tropas</span>
        </div>
        <div className="border-t border-border/30 pt-1.5 mt-1.5 space-y-0.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Você restará com:</span>
            <span className="text-foreground font-bold">~{result.avgAttackerRemaining}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Inimigo restará com:</span>
            <span className="text-foreground font-bold">~{result.avgDefenderRemaining}</span>
          </div>
        </div>
      </div>

      {/* Confirm */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-2 text-center">
        <p className="text-xs text-muted-foreground font-body mb-1">
          Atacar com <span className="text-primary font-bold">{attackerTroops}</span> tropas?
        </p>
        <div className="flex items-center justify-center gap-1 text-[10px]">
          <span className={`${risk.color}`}>Vitória: {result.chanceVitoria}%</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">Perdas: ~{result.avgAttackerLoss}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={onCancel} size="sm" className="font-body">
          <X className="w-3.5 h-3.5 mr-1" /> Cancelar
        </Button>
        <Button onClick={onConfirm} size="sm" className="font-display tracking-wider"
          variant={result.riskLevel === 'high' ? 'destructive' : 'default'}>
          <Swords className="w-3.5 h-3.5 mr-1" /> Atacar
        </Button>
      </div>
    </motion.div>
  );
}
