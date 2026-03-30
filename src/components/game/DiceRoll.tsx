import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DiceRollProps {
  values: number[];
  rolling: boolean;
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  label?: string;
}

const DICE_FACES: Record<number, number[][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

function DiceFace({ value, size, color, animate }: { value: number; size: number; color: string; animate: boolean }) {
  const dots = DICE_FACES[Math.min(6, Math.max(1, value))] || DICE_FACES[1];
  const dotR = size * 0.08;
  const pad = size * 0.22;
  const step = (size - pad * 2) / 2;

  return (
    <motion.div
      className="relative rounded-lg border-2 flex items-center justify-center"
      style={{
        width: size,
        height: size,
        backgroundColor: 'hsl(var(--card))',
        borderColor: color,
        boxShadow: `0 0 12px ${color}40, inset 0 1px 3px rgba(0,0,0,0.3)`,
      }}
      animate={animate ? {
        rotateX: [0, 360, 720, 1080],
        rotateY: [0, 180, 360, 540],
        scale: [1, 1.15, 0.95, 1.05, 1],
      } : { rotateX: 0, rotateY: 0, scale: 1 }}
      transition={animate ? { duration: 1.2, ease: 'easeOut' } : { duration: 0.3 }}
    >
      <svg width={size - 8} height={size - 8} viewBox={`0 0 ${size} ${size}`}>
        {dots.map(([row, col], i) => (
          <circle
            key={i}
            cx={pad + col * step}
            cy={pad + row * step}
            r={dotR}
            fill={color}
          />
        ))}
      </svg>
    </motion.div>
  );
}

export function DiceRoll({ values, rolling, onComplete, size = 'md', color = 'hsl(38, 60%, 55%)', label }: DiceRollProps) {
  const [displayValues, setDisplayValues] = useState(values);
  const [isAnimating, setIsAnimating] = useState(false);

  const pixelSize = size === 'sm' ? 40 : size === 'md' ? 56 : 72;

  const animate = useCallback(() => {
    setIsAnimating(true);
    let frame = 0;
    const totalFrames = 18;
    const interval = setInterval(() => {
      frame++;
      setDisplayValues(values.map(() => Math.floor(Math.random() * 6) + 1));
      if (frame >= totalFrames) {
        clearInterval(interval);
        setDisplayValues(values);
        setIsAnimating(false);
        onComplete?.();
      }
    }, 70);
    return () => clearInterval(interval);
  }, [values, onComplete]);

  useEffect(() => {
    if (rolling) {
      const cleanup = animate();
      return cleanup;
    } else {
      setDisplayValues(values);
    }
  }, [rolling, animate, values]);

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span className="text-xs font-body text-muted-foreground tracking-wide uppercase">{label}</span>
      )}
      <div className="flex items-center gap-3">
        <AnimatePresence mode="wait">
          {displayValues.map((val, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
            >
              <DiceFace value={val} size={pixelSize} color={color} animate={isAnimating} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {!isAnimating && !rolling && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs font-body text-muted-foreground"
        >
          Total: <span className="text-primary font-bold">{displayValues.reduce((a, b) => a + b, 0)}</span>
        </motion.div>
      )}
    </div>
  );
}
