import { motion } from 'framer-motion';
import { TERRITORIES } from '@/lib/gameConstants';

interface WormExplosionProps {
  targetId: string;
  onComplete: () => void;
}

export function WormExplosion({ targetId, onComplete }: WormExplosionProps) {
  const def = TERRITORIES.find(t => t.id === targetId);
  if (!def) return null;

  const cx = def.pos_x;
  const cy = def.pos_y;

  return (
    <g>
      {/* Sand explosion rings */}
      {[0, 1, 2].map(i => (
        <motion.circle
          key={`ring-${i}`}
          cx={cx}
          cy={cy}
          r={20}
          fill="none"
          stroke="hsl(38, 70%, 55%)"
          strokeWidth={3 - i}
          initial={{ r: 10, opacity: 0.8 }}
          animate={{ r: 80 + i * 20, opacity: 0 }}
          transition={{ duration: 1, delay: i * 0.15, ease: 'easeOut' }}
          onAnimationComplete={i === 2 ? onComplete : undefined}
        />
      ))}

      {/* Central flash */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={8}
        fill="hsl(38, 80%, 65%)"
        initial={{ r: 4, opacity: 1 }}
        animate={{ r: 30, opacity: 0 }}
        transition={{ duration: 0.6 }}
      />

      {/* Territory shake effect via transform */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={42}
        fill="hsl(0, 60%, 50%)"
        fillOpacity={0.15}
        animate={{
          x: [0, -3, 3, -2, 2, 0],
          y: [0, 2, -2, 1, -1, 0],
          opacity: [0.3, 0.2, 0.3, 0.1, 0],
        }}
        transition={{ duration: 0.8 }}
      />

      {/* Sand particles */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const dist = 50 + Math.random() * 30;
        return (
          <motion.circle
            key={`particle-${i}`}
            cx={cx}
            cy={cy}
            r={2}
            fill="hsl(38, 60%, 50%)"
            initial={{ cx, cy, opacity: 1 }}
            animate={{
              cx: cx + Math.cos(angle) * dist,
              cy: cy + Math.sin(angle) * dist,
              opacity: 0,
              r: 0,
            }}
            transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
          />
        );
      })}
    </g>
  );
}
