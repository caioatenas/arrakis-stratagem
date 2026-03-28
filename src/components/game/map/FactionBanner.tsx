import type { Faction } from '@/lib/factions';

interface FactionBannerProps {
  x: number;
  y: number;
  faction: Faction;
}

export function FactionBanner({ x, y, faction }: FactionBannerProps) {
  const bx = x + 24;
  const by = y - 20;
  const w = 10;
  const h = 18;

  return (
    <g className="banner-wave" style={{ transformOrigin: `${bx}px ${by}px` }}>
      {/* Pole */}
      <line x1={bx} y1={by} x2={bx} y2={by + h + 4}
        stroke="hsl(30, 20%, 55%)" strokeWidth={1.5} />
      {/* Banner cloth */}
      <path
        d={`M ${bx} ${by} L ${bx + w} ${by + 3} L ${bx + w} ${by + h - 2} L ${bx} ${by + h} Z`}
        fill={faction.color} fillOpacity={0.85}
        stroke={faction.color} strokeWidth={0.5}
      />
      {/* Symbol on banner */}
      <text x={bx + w / 2 + 0.5} y={by + h / 2 + 1} textAnchor="middle"
        dominantBaseline="central" fontSize="7">
        {faction.symbol}
      </text>
    </g>
  );
}
