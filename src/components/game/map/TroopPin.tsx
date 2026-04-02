import { motion } from 'framer-motion';
import type { Faction } from '@/lib/factions';

interface TroopPinProps {
  x: number;
  y: number;
  forca: number;
  faction: Faction | null;
  isSelected: boolean;
  defesaBase: number;
  strategicMode?: boolean;
}

function getStrengthColor(forca: number): string {
  if (forca <= 20) return '#ef4444'; // red - weak
  if (forca <= 50) return '#eab308'; // yellow - medium
  return '#22c55e'; // green - strong
}

function getPinSize(forca: number): { r: number; tier: 'small' | 'medium' | 'large' } {
  if (forca >= 61) return { r: 22, tier: 'large' };
  if (forca >= 21) return { r: 18, tier: 'medium' };
  return { r: 15, tier: 'small' };
}

function getTroopIcons(forca: number): number {
  return Math.min(Math.floor(forca / 20), 5);
}

export function TroopPin({ x, y, forca, faction, isSelected, defesaBase, strategicMode }: TroopPinProps) {
  const { r, tier } = getPinSize(forca);
  const gradientId = faction ? `pin-${faction.id}` : 'pin-neutral';
  const highDefense = defesaBase >= 7;
  const strengthColor = getStrengthColor(forca);
  const troopIconCount = getTroopIcons(forca);
  const fontSize = tier === 'large' ? 20 : tier === 'medium' ? 17 : 14;

  return (
    <g>
      {/* Density rings - only in normal mode */}
      {!strategicMode && forca >= 21 && (
        <circle cx={x} cy={y} r={r + 8} fill="none"
          stroke={faction?.color || 'hsl(30,12%,40%)'} strokeWidth={1.2}
          opacity={0.4} className="density-ring-pulse" />
      )}
      {!strategicMode && forca >= 61 && (
        <motion.circle cx={x} cy={y} r={r + 14} fill="none"
          stroke={faction?.color || 'hsl(30,12%,40%)'} strokeWidth={0.8}
          opacity={0.25} className="density-ring-pulse"
          style={{ animationDelay: '0.5s' }} />
      )}

      {/* Large glow for 61+ */}
      {!strategicMode && tier === 'large' && (
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

      {/* Pin base circle */}
      <motion.circle cx={x} cy={y} r={r}
        fill={strategicMode ? 'hsl(0,0%,15%)' : `url(#${gradientId})`}
        stroke={isSelected ? '#fff' : strengthColor}
        strokeWidth={isSelected ? 3 : 2}
        filter="url(#drop-shadow)"
        animate={{ scale: isSelected ? 1.15 : 1 }}
        style={{ transformOrigin: `${x}px ${y}px` }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      />

      {/* Inner highlight */}
      {!strategicMode && (
        <circle cx={x} cy={y - r * 0.2} r={r * 0.5}
          fill="white" fillOpacity={0.12} />
      )}

      {/* === TROOP COUNT - PRIMARY VISUAL === */}
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central"
        fill="#FFFFFF" fontSize={fontSize}
        fontWeight="900" fontFamily="Rajdhani, sans-serif"
        stroke="rgba(0,0,0,0.6)" strokeWidth={0.8}
        style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5)' }}>
        {forca}
      </text>

      {/* Strength color glow behind number */}
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central"
        fill={strengthColor} fontSize={fontSize}
        fontWeight="900" fontFamily="Rajdhani, sans-serif"
        opacity={0.4} filter="url(#glow-soft)">
        {forca}
      </text>

      {/* === STRENGTH BAR === */}
      <rect x={x - 20} y={y + r + 3} width={40} height={4} rx={2}
        fill="rgba(0,0,0,0.5)" />
      <rect x={x - 20} y={y + r + 3} width={Math.min((forca / 100) * 40, 40)} height={4} rx={2}
        fill={strengthColor} opacity={0.85} />

      {/* === TROOP ICONS (pips) === */}
      {!strategicMode && troopIconCount > 0 && (
        <g>
          {Array.from({ length: troopIconCount }).map((_, i) => {
            const spread = (troopIconCount - 1) * 5;
            const iconX = x - spread / 2 + i * 5;
            const iconY = y - r - 6;
            return (
              <circle key={i} cx={iconX} cy={iconY} r={2}
                fill={strengthColor} stroke="rgba(0,0,0,0.4)" strokeWidth={0.5} />
            );
          })}
        </g>
      )}

      {/* Faction symbol (small, below bar) - only in normal mode */}
      {!strategicMode && faction && (
        <text x={x} y={y + r + 12} textAnchor="middle" dominantBaseline="hanging"
          fontSize="7" opacity={0.6}>
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
