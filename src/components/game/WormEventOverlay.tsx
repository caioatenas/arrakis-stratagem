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
            {/* Animated Sandworm SVG */}
            <motion.div
              className="relative w-32 h-32 mx-auto"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <svg viewBox="0 0 120 120" className="w-full h-full">
                {/* Sand dune base */}
                <motion.ellipse
                  cx="60" cy="105" rx="55" ry="12"
                  fill="hsl(38, 50%, 40%)"
                  initial={{ scaleX: 0.3, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 0.7 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                />
                {/* Sand particles flying up */}
                {[...Array(8)].map((_, i) => {
                  const angle = (i / 8) * Math.PI;
                  const dx = Math.cos(angle) * (20 + i * 5);
                  const dy = -Math.abs(Math.sin(angle)) * (15 + i * 4);
                  return (
                    <motion.circle
                      key={`sand-${i}`}
                      cx={60 + dx * 0.3}
                      cy={100}
                      r={1.5 + Math.random()}
                      fill="hsl(38, 60%, 55%)"
                      initial={{ cx: 60, cy: 100, opacity: 0 }}
                      animate={{
                        cx: 60 + dx,
                        cy: 100 + dy,
                        opacity: [0, 0.8, 0],
                        r: [1, 2.5, 0.5],
                      }}
                      transition={{
                        duration: 1.2,
                        delay: 0.3 + i * 0.07,
                        repeat: Infinity,
                        repeatDelay: 1.5,
                      }}
                    />
                  );
                })}
                {/* Worm body segments emerging from sand */}
                <motion.path
                  d="M60 100 C60 85, 45 70, 50 50 C55 30, 65 25, 60 15"
                  stroke="hsl(25, 45%, 35%)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                />
                {/* Worm body texture/segments */}
                <motion.path
                  d="M60 100 C60 85, 45 70, 50 50 C55 30, 65 25, 60 15"
                  stroke="hsl(25, 55%, 45%)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray="3 6"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.7 }}
                  transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                />
                {/* Worm head */}
                <motion.g
                  initial={{ y: 30, opacity: 0, scale: 0.5 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Head shape */}
                  <ellipse cx="60" cy="12" rx="10" ry="13" fill="hsl(25, 45%, 35%)" />
                  {/* Mouth opening */}
                  <motion.path
                    d="M52 8 C55 2, 65 2, 68 8"
                    stroke="hsl(0, 50%, 30%)"
                    strokeWidth="2.5"
                    fill="hsl(0, 40%, 20%)"
                    animate={{
                      d: [
                        "M52 8 C55 2, 65 2, 68 8",
                        "M50 6 C54 -2, 66 -2, 70 6",
                        "M52 8 C55 2, 65 2, 68 8",
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {/* Teeth/mandibles */}
                  {[54, 57, 60, 63, 66].map((tx, i) => (
                    <motion.line
                      key={`tooth-${i}`}
                      x1={tx} y1={6} x2={tx} y2={2}
                      stroke="hsl(40, 30%, 80%)"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      animate={{ y2: [2, 0, 2] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                  {/* Eyes (small glowing dots) */}
                  <circle cx="55" cy="14" r="1.8" fill="hsl(38, 80%, 60%)" />
                  <circle cx="65" cy="14" r="1.8" fill="hsl(38, 80%, 60%)" />
                  <motion.circle
                    cx="55" cy="14" r="3"
                    fill="none"
                    stroke="hsl(38, 80%, 60%)"
                    strokeWidth="0.5"
                    animate={{ r: [3, 5, 3], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.circle
                    cx="65" cy="14" r="3"
                    fill="none"
                    stroke="hsl(38, 80%, 60%)"
                    strokeWidth="0.5"
                    animate={{ r: [3, 5, 3], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.g>
                {/* Body sway animation */}
                <motion.path
                  d="M60 100 C60 85, 45 70, 50 50 C55 30, 65 25, 60 15"
                  stroke="hsl(25, 40%, 28%)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  fill="none"
                  opacity={0.15}
                  animate={{
                    d: [
                      "M60 100 C60 85, 45 70, 50 50 C55 30, 65 25, 60 15",
                      "M60 100 C58 83, 48 72, 52 52 C56 32, 63 23, 58 13",
                      "M60 100 C62 87, 42 68, 48 48 C54 28, 67 27, 62 17",
                      "M60 100 C60 85, 45 70, 50 50 C55 30, 65 25, 60 15",
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              </svg>
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
