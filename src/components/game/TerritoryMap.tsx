import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Territory, PlayerEstado } from '@/hooks/useGameState';
import { TERRITORIES, REGION_COLORS, REGION_NAMES } from '@/lib/gameConstants';
import mapBg from '@/assets/map-background.jpg';

interface TerritoryMapProps {
  territories: Territory[];
  playerEstados: PlayerEstado[];
  selectedTerritory: string | null;
  onSelectTerritory: (id: string) => void;
  currentPlayerId: string | null;
}

function getTerritoryPath(cx: number, cy: number, r: number, seed: number): string {
  const points: string[] = [];
  const sides = 6;
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    const jitter = 0.85 + (Math.sin(seed * 7 + i * 13) * 0.15);
    const px = cx + r * jitter * Math.cos(angle);
    const py = cy + r * jitter * Math.sin(angle);
    points.push(`${px},${py}`);
  }
  let d = `M ${points[0]}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i]}`;
  }
  d += ' Z';
  return d;
}

function getBezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const cx1 = mx - dy * 0.15;
  const cy1 = my + dx * 0.15;
  return `M ${x1} ${y1} Q ${cx1} ${cy1} ${x2} ${y2}`;
}

export function TerritoryMap({ territories, playerEstados, selectedTerritory, onSelectTerritory, currentPlayerId }: TerritoryMapProps) {
  const [hoveredTerritory, setHoveredTerritory] = useState<string | null>(null);

  const getPlayerColor = (donoId: string | null) => {
    if (!donoId) return 'hsl(30, 12%, 35%)';
    const pe = playerEstados.find(p => p.player_id === donoId);
    return pe?.cor || '#555';
  };

  const displayTerritories = territories.length > 0 ? territories : TERRITORIES.map(t => ({
    ...t,
    partida_id: '',
    dono_id: null,
    forca: 50,
  }));

  const connections = useMemo(() => {
    const conns: [string, string][] = [];
    const seen = new Set<string>();
    for (const t of TERRITORIES) {
      for (const v of t.vizinhos) {
        const key = [t.id, v].sort().join('-');
        if (!seen.has(key)) {
          seen.add(key);
          conns.push([t.id, v]);
        }
      }
    }
    return conns;
  }, []);

  const getPos = (id: string) => {
    const def = TERRITORIES.find(t => t.id === id);
    return def ? { x: def.pos_x, y: def.pos_y } : { x: 0, y: 0 };
  };

  const selectedNeighbors = useMemo(() => {
    if (!selectedTerritory) return new Set<string>();
    const t = TERRITORIES.find(t => t.id === selectedTerritory);
    return new Set(t?.vizinhos || []);
  }, [selectedTerritory]);

  const isConnectionHighlighted = (a: string, b: string) => {
    if (!selectedTerritory) return false;
    return (a === selectedTerritory && selectedNeighbors.has(b)) ||
           (b === selectedTerritory && selectedNeighbors.has(a));
  };

  // Region label positions
  const regionLabels = useMemo(() => {
    const regions: Record<string, { xs: number[]; ys: number[] }> = {};
    for (const t of TERRITORIES) {
      if (!regions[t.regiao]) regions[t.regiao] = { xs: [], ys: [] };
      regions[t.regiao].xs.push(t.pos_x);
      regions[t.regiao].ys.push(t.pos_y);
    }
    return Object.entries(regions).map(([r, { xs, ys }]) => ({
      regiao: r,
      x: xs.reduce((a, b) => a + b, 0) / xs.length,
      y: Math.min(...ys) - 30,
    }));
  }, []);

  return (
    <div className="relative w-full h-full min-h-[600px] rounded-xl overflow-hidden" data-tutorial="map">
      <img src={mapBg} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'blur(2px)' }} />
      <div className="absolute inset-0 bg-background/60" />

      <svg viewBox="0 0 950 800" className="relative w-full h-full z-10" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="glow-selected">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-hover">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-soft">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-rico">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <style>{`
            @keyframes dash-flow { to { stroke-dashoffset: -24; } }
            .connection-line { animation: dash-flow 1.5s linear infinite; }
            @keyframes pulse-glow { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
            .pulse-connection { animation: pulse-glow 2s ease-in-out infinite; }
            @keyframes rico-pulse { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.35; } }
            .rico-glow { animation: rico-pulse 3s ease-in-out infinite; }
          `}</style>
        </defs>

        {/* Region labels */}
        {regionLabels.map(({ regiao, x, y }) => (
          <text key={regiao} x={x} y={y} textAnchor="middle" fill={REGION_COLORS[regiao] || '#888'}
            fontSize="12" fontFamily="Cinzel, serif" letterSpacing="3" opacity={0.6}>
            {(REGION_NAMES[regiao] || regiao).toUpperCase()}
          </text>
        ))}

        {/* Connections */}
        {connections.map(([a, b]) => {
          const pa = getPos(a);
          const pb = getPos(b);
          const highlighted = isConnectionHighlighted(a, b);
          const dimmed = selectedTerritory && !highlighted;
          return (
            <g key={`${a}-${b}`}>
              <path d={getBezierPath(pa.x, pa.y, pb.x, pb.y)}
                stroke={highlighted ? 'hsl(38, 60%, 55%)' : 'hsl(38, 30%, 30%)'}
                strokeWidth={highlighted ? 2.5 : 1}
                fill="none" strokeDasharray={highlighted ? '12,6' : '6,4'}
                opacity={dimmed ? 0.1 : highlighted ? 0.9 : 0.3}
                className={highlighted ? 'connection-line' : ''}
                style={{ transition: 'opacity 0.3s, stroke 0.3s' }} />
              {highlighted && (
                <path d={getBezierPath(pa.x, pa.y, pb.x, pb.y)}
                  stroke="hsl(38, 60%, 55%)" strokeWidth={5} fill="none"
                  opacity={0.12} className="pulse-connection" filter="url(#glow-soft)" />
              )}
            </g>
          );
        })}

        {/* Territories */}
        {displayTerritories.map((t, idx) => {
          const def = TERRITORIES.find(d => d.id === t.id);
          const regiao = (t as any).regiao || def?.regiao || 'centro';
          const tipo = (t as any).tipo || def?.tipo || 'comum';
          const color = getPlayerColor(t.dono_id);
          const isSelected = selectedTerritory === t.id;
          const isHovered = hoveredTerritory === t.id;
          const isNeighbor = selectedNeighbors.has(t.id);
          const dimmed = selectedTerritory && !isSelected && !isNeighbor;
          const outerR = 38;
          const innerR = 18;
          const seed = idx * 3.7;
          const px = def?.pos_x ?? t.pos_x;
          const py = def?.pos_y ?? t.pos_y;

          return (
            <g key={t.id}
              onClick={() => onSelectTerritory(t.id)}
              onMouseEnter={() => setHoveredTerritory(t.id)}
              onMouseLeave={() => setHoveredTerritory(null)}
              className="cursor-pointer"
              style={{ transition: 'opacity 0.3s', opacity: dimmed ? 0.25 : 1 }}>

              {/* Rico glow ring */}
              {tipo === 'rico' && (
                <circle cx={px} cy={py} r={outerR + 6} fill="none"
                  stroke="hsl(45, 80%, 55%)" strokeWidth={2} className="rico-glow"
                  filter="url(#glow-rico)" />
              )}

              {/* Outer shape */}
              <motion.path d={getTerritoryPath(px, py, outerR, seed)}
                fill={color} fillOpacity={isSelected ? 0.4 : isHovered ? 0.3 : 0.18}
                stroke={isSelected ? '#C4A35A' : isNeighbor && selectedTerritory ? 'hsl(38, 50%, 50%)' : color}
                strokeWidth={isSelected ? 3 : isHovered ? 2 : 1.2}
                filter={isSelected ? 'url(#glow-selected)' : isHovered ? 'url(#glow-hover)' : undefined}
                animate={{ scale: isSelected ? 1.1 : isHovered ? 1.05 : 1 }}
                style={{ transformOrigin: `${px}px ${py}px` }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }} />

              {/* Inner core */}
              <circle cx={px} cy={py} r={innerR} fill={color} fillOpacity={0.45} stroke={color} strokeWidth={0.8} />

              {/* Force */}
              <text x={px} y={py + 5} textAnchor="middle" fill="hsl(38, 30%, 92%)"
                fontSize="15" fontWeight="bold" fontFamily="Rajdhani, sans-serif">{t.forca}</text>

              {/* Name */}
              <text x={px} y={py + outerR + 14} textAnchor="middle" fill="hsl(38, 25%, 70%)"
                fontSize="8.5" fontFamily="Cinzel, serif" letterSpacing="0.5">
                {t.nome}
              </text>

              {/* Spice indicator */}
              <text x={px} y={py - outerR - 6} textAnchor="middle"
                fill={tipo === 'rico' ? 'hsl(45, 80%, 65%)' : 'hsl(210, 70%, 65%)'}
                fontSize="9" fontFamily="Rajdhani, sans-serif" filter="url(#glow-soft)">
                ⟡ {t.producao_spice}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredTerritory && !selectedTerritory && (() => {
          const t = displayTerritories.find(t => t.id === hoveredTerritory);
          if (!t) return null;
          const def = TERRITORIES.find(d => d.id === t.id);
          const owner = t.dono_id ? playerEstados.find(p => p.player_id === t.dono_id) : null;
          const regiao = (t as any).regiao || def?.regiao || '';
          const tipo = (t as any).tipo || def?.tipo || 'comum';
          return (
            <motion.div key={hoveredTerritory}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
              className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 z-20 min-w-[180px]">
              <h4 className="text-display text-primary text-sm tracking-wide">{t.nome}</h4>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">{REGION_NAMES[regiao] || regiao} · {tipo}</p>
              <div className="mt-1.5 space-y-0.5 text-xs font-body">
                <p className="text-foreground">Força: <span className="text-primary font-bold">{t.forca}</span></p>
                <p className="text-foreground">Defesa: <span className="font-bold">{t.defesa_base}</span></p>
                <p className="text-accent">⟡ Spice: {t.producao_spice}/turno</p>
                {owner && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: owner.cor }} />
                    <span className="text-muted-foreground">
                      {owner.player_id === currentPlayerId ? 'Seu território' : 'Inimigo'}
                    </span>
                  </div>
                )}
                {!t.dono_id && <p className="text-muted-foreground">Neutro</p>}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
