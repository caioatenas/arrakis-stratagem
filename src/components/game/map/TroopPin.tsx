import { motion } from 'framer-motion';
import type { Faction } from '@/lib/factions';

interface TroopPinProps {
  x: number;
  y: number;
  forca: number;
  faction: Faction | null;
  isSelected: boolean;
  defesaBase: number;
}

function getPinSize(forca: number): { r: number; tier: 'small' | 'medium' | 'large' } {
  if (forca >= 61) return { r: 22, tier: 'large' };
  if (forca >= 21) return { r: 18, tier: 'medium' };
  return { r: 15, tier: 'small' };
}

function getDensityRings(forca: number): number {
  if (forca >= 61) return 2;
  if (forca >= 21) return 1;
  return 0;
}

export function TroopPin({ x, y, forca, faction, isSelected, defesaBase }: TroopPinProps) {
  const { r, tier } = getPinSize(forca);
  const rings = getDensityRings(forca);
  const gradientId = faction ? `pin-${faction.id}` : 'pin-neutral';
  const highDefense = defesaBase >= 7;

  return (
    <g>
      {/* Density rings */}
      {rings >= 1 && (
        <circle cx={x} cy={y} r={r + 8} fill="none"
          stroke={faction?.color || 'hsl(30,12%,40%)'} strokeWidth={1.2}
          opacity={0.4} className="density-ring-pulse" />
      )}
      {rings >= 2 && (
        <motion.circle cx={x} cy={y} r={r + 14} fill="none"
          stroke={faction?.color || 'hsl(30,12%,40%)'} strokeWidth={0.8}
          opacity={0.25} className="density-ring-pulse"
          style={{ animationDelay: '0.5s' }} />
      )}

      {/* Large glow for 61+ */}
      {tier === 'large' && (
        <circle cx={x} cy={y} r={r + 6} fill={faction?.color || '#555'}
          fillOpacity={0.15} filter="url(#glow-soft)" />
      )}

      {/* Shield indicator for high defense */}
      {highDefense && (
        <circle cx={x} cy={y} r={r + 4} fill="none"
          stroke="hsl(200, 60%, 60%)" strokeWidth={1.5}
          strokeDasharray="5,5" className="shield-rotate"
          filter="url(#shield-glow)" opacity={0.5} />
      )}

      {/* Pin base - shield shape */}
      <motion.circle cx={x} cy={y} r={r}
        fill={`url(#${gradientId})`}
        stroke={isSelected ? '#fff' : (faction?.color || 'hsl(30,12%,50%)')}
        strokeWidth={isSelected ? 2.5 : 1.5}
        filter="url(#drop-shadow)"
        animate={{ scale: isSelected ? 1.08 : 1 }}
        style={{ transformOrigin: `${x}px ${y}px` }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      />

      {/* Inner highlight */}
      <circle cx={x} cy={y - r * 0.2} r={r * 0.5}
        fill="white" fillOpacity={0.12} />

      {/* Troop count */}
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central"
        fill="#fff" fontSize={tier === 'large' ? 16 : tier === 'medium' ? 14 : 12}
        fontWeight="bold" fontFamily="Rajdhani, sans-serif"
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
        {forca}
      </text>

      {/* Faction symbol (small, below count) */}
      {faction && (
        <text x={x} y={y + r + 2} textAnchor="middle" dominantBaseline="hanging"
          fontSize="8" opacity={0.7}>
          {faction.symbol}
        </text>
      )}

      {/* Shield icon for high defense */}
      {highDefense && (
        <text x={x + r - 2} y={y - r + 4} textAnchor="middle"
          fontSize="9" filter="url(#shield-glow)" opacity={0.8}>
          🛡
        </text>
      )}
    </g>
  );
}
