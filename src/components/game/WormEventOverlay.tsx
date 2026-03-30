import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiceRoll } from './DiceRoll';

export interface WormEventData {
  dice: [number, number];
  activated: boolean;
  wormStrength?: number;
  targetName?: string;
  targetId?: string;
  result?: 'attack_wins' | 'defense_wins' | 'draw';
  message?: string;
}

interface WormEventOverlayProps {
  event: WormEventData | null;
  onComplete: () => void;
}

export function WormEventOverlay({ event, onComplete }: WormEventOverlayProps) {
  const [phase, setPhase] = useState<'dice' | 'result' | 'done'>('dice');
  const [diceRolling, setDiceRolling] = useState(true);

  useEffect(() => {
    if (!event) {
      setPhase('dice');
      setDiceRolling(true);
      return;
    }
    setPhase('dice');
    setDiceRolling(true);
  }, [event]);

  const handleDiceComplete = () => {
    setDiceRolling(false);
    setTimeout(() => {
      setPhase('result');
      setTimeout(() => {
        setPhase('done');
        onComplete();
      }, 3000);
    }, 800);
  };

  if (!event) return null;

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-card border border-border rounded-xl p-8 max-w-md w-full mx-4 text-center space-y-6"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-5xl"
            >
              🪱
            </motion.div>

            <h2 className="text-display text-2xl text-primary tracking-[0.15em]">
              VERME DA AREIA
            </h2>

            <p className="text-sm text-muted-foreground font-body">
              Rolando dados para verificar ativação...
            </p>

            <DiceRoll
              values={event.dice}
              rolling={diceRolling}
              onComplete={handleDiceComplete}
              size="lg"
              color={event.activated ? 'hsl(0, 70%, 55%)' : 'hsl(38, 60%, 55%)'}
              label="Dados de Ativação (d6 + d6)"
            />

            <AnimatePresence mode="wait">
              {phase === 'result' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {event.activated ? (
                    <>
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                        <p className="text-sm font-body text-destructive font-bold">
                          ⚠️ DADOS IGUAIS — VERME ATIVADO!
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Força do verme: <span className="text-primary font-bold">{event.wormStrength}</span>
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <p className="text-sm font-body text-foreground">
                          Alvo: <span className="text-primary font-bold">{event.targetName}</span>
                        </p>
                        {event.result === 'attack_wins' && (
                          <p className="text-xs text-destructive mt-1">💥 O verme devastou o território! (-50% força, -20% defesa)</p>
                        )}
                        {event.result === 'defense_wins' && (
                          <p className="text-xs text-accent mt-1">🛡️ O território resistiu! (-20% força)</p>
                        )}
                        {event.result === 'draw' && (
                          <p className="text-xs text-muted-foreground mt-1">⚔️ Empate! Ambos perderam 30%</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
                      <p className="text-sm font-body text-accent font-bold">
                        ✓ Dados diferentes — Nenhum verme emergiu
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        O deserto permanece calmo... por enquanto.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
