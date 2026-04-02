import { motion } from 'framer-motion';
import { TERRITORIES } from '@/lib/gameConstants';

interface MovementAnimationProps {
  originId: string;
  destinationId: string;
  quantity: number;
  playerColor: string;
  tipo?: 'mover' | 'atacar';
  onComplete: () => void;
}

function getBezierPath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const cx = mx - dy * 0.15;
  const cy = my + dx * 0.15;
  return { path: `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`, cx, cy };
}

export function MovementAnimation({ originId, destinationId, quantity, playerColor, onComplete }: MovementAnimationProps) {
  const origin = TERRITORIES.find(t => t.id === originId);
  const dest = TERRITORIES.find(t => t.id === destinationId);
  if (!origin || !dest) return null;

  const { path } = getBezierPath(origin.pos_x, origin.pos_y, dest.pos_x, dest.pos_y);
  const particleCount = Math.min(5, Math.max(2, Math.ceil(quantity / 15)));

  return (
    <g>
      {/* Glow trail */}
      <motion.path d={path} fill="none" stroke={playerColor} strokeWidth={4} strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0.6 }}
        animate={{ pathLength: 1, opacity: [0.6, 0.3, 0] }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        filter="url(#glow-soft)" />

      {/* Animated particles along path */}
      {Array.from({ length: particleCount }).map((_, i) => (
        <motion.circle key={i} r={3.5} fill={playerColor} filter="url(#glow-selected)"
          initial={{ offsetDistance: '0%', opacity: 0 }}
          animate={{ offsetDistance: '100%', opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.7, delay: i * 0.1, ease: 'easeInOut' }}
          onAnimationComplete={i === particleCount - 1 ? onComplete : undefined}
          style={{ offsetPath: `path('${path}')` } as React.CSSProperties} />
      ))}

      {/* Quantity label following the path center */}
      <motion.g
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: [0, 1, 1, 0], scale: 1 }}
        transition={{ duration: 0.8 }}>
        <circle cx={(origin.pos_x + dest.pos_x) / 2} cy={(origin.pos_y + dest.pos_y) / 2 - 5}
          r={12} fill="hsl(var(--background))" stroke={playerColor} strokeWidth={1.5} opacity={0.9} />
        <text x={(origin.pos_x + dest.pos_x) / 2} y={(origin.pos_y + dest.pos_y) / 2 - 2}
          textAnchor="middle" fill={playerColor} fontSize="9" fontFamily="Rajdhani, sans-serif" fontWeight="bold">
          {quantity}
        </text>
      </motion.g>

      {/* Destination pulse */}
      <motion.circle cx={dest.pos_x} cy={dest.pos_y} r={42}
        fill="none" stroke={playerColor} strokeWidth={2}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: [0.8, 1.2], opacity: [0, 0.4, 0] }}
        transition={{ duration: 0.8, delay: 0.5 }} 
        style={{ transformOrigin: `${dest.pos_x}px ${dest.pos_y}px` }} />
    </g>
  );
}
