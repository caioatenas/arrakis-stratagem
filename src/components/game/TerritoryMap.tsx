import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Territory, PlayerEstado } from '@/hooks/useGameState';
import { TERRITORIES, REGION_COLORS, REGION_NAMES } from '@/lib/gameConstants';
import { getFactionByColor, FACTIONS } from '@/lib/factions';
import { MapDefs } from './map/MapDefs';
import { ConnectionLines } from './map/ConnectionLines';
import { TroopPin } from './map/TroopPin';
import { FactionBanner } from './map/FactionBanner';
import { SpiceParticles } from './map/SpiceParticles';
import { MapLegend } from './map/MapLegend';
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
  for (let i = 1; i < points.length; i++) d += ` L ${points[i]}`;
  d += ' Z';
  return d;
}

export function TerritoryMap({ territories, playerEstados, selectedTerritory, onSelectTerritory, currentPlayerId }: TerritoryMapProps) {
  const [hoveredTerritory, setHoveredTerritory] = useState<string | null>(null);

  const getFaction = (donoId: string | null) => {
    if (!donoId) return null;
    const pe = playerEstados.find(p => p.player_id === donoId);
    if (!pe) return null;
    const idx = playerEstados.indexOf(pe);
    return FACTIONS[idx % FACTIONS.length];
  };

  const getPlayerColor = (donoId: string | null) => {
    if (!donoId) return 'hsl(30, 12%, 35%)';
    const pe = playerEstados.find(p => p.player_id === donoId);
    return pe?.cor || '#555';
  };

  const displayTerritories = territories.length > 0 ? territories : TERRITORIES.map(t => ({
    ...t, partida_id: '', dono_id: null, forca: 50,
  }));

  const selectedNeighbors = useMemo(() => {
    if (!selectedTerritory) return new Set<string>();
    const t = TERRITORIES.find(t => t.id === selectedTerritory);
    return new Set(t?.vizinhos || []);
  }, [selectedTerritory]);

  // Region labels
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
      y: Math.min(...ys) - 35,
    }));
  }, []);

  return (
    <div className="relative w-full h-full min-h-[600px] rounded-xl overflow-hidden" data-tutorial="map">
      {/* Layer 1: Background */}
      <img src={mapBg} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'blur(2px)' }} />
      {/* Layer 2: Dark overlay */}
      <div className="absolute inset-0 bg-background/65" />

      <svg viewBox="0 0 950 800" className="relative w-full h-full z-10" preserveAspectRatio="xMidYMid meet">
        <MapDefs />

        {/* Region labels */}
        {regionLabels.map(({ regiao, x, y }) => (
          <text key={regiao} x={x} y={y} textAnchor="middle" fill={REGION_COLORS[regiao] || '#888'}
            fontSize="11" fontFamily="Cinzel, serif" letterSpacing="3" opacity={0.5}>
            {(REGION_NAMES[regiao] || regiao).toUpperCase()}
          </text>
        ))}

        {/* Layer 3: Connection lines */}
        <ConnectionLines selectedTerritory={selectedTerritory} selectedNeighbors={selectedNeighbors} />

        {/* Layer 4+5: Territories */}
        {displayTerritories.map((t, idx) => {
          const def = TERRITORIES.find(d => d.id === t.id);
          const regiao = (t as any).regiao || def?.regiao || 'centro';
          const tipo = (t as any).tipo || def?.tipo || 'comum';
          const faction = getFaction(t.dono_id);
          const color = getPlayerColor(t.dono_id);
          const isSelected = selectedTerritory === t.id;
          const isHovered = hoveredTerritory === t.id;
          const isNeighbor = selectedNeighbors.has(t.id);
          const dimmed = selectedTerritory && !isSelected && !isNeighbor;
          const isEnemy = t.dono_id && t.dono_id !== currentPlayerId;
          const outerR = 38;
          const seed = idx * 3.7;
          const px = def?.pos_x ?? t.pos_x;
          const py = def?.pos_y ?? t.pos_y;

          return (
            <g key={t.id}
              onClick={() => onSelectTerritory(t.id)}
              onMouseEnter={() => setHoveredTerritory(t.id)}
              onMouseLeave={() => setHoveredTerritory(null)}
              className="cursor-pointer"
              style={{ transition: 'opacity 0.3s', opacity: dimmed ? 0.2 : 1 }}>

              {/* Spice particles */}
              <SpiceParticles x={px} y={py} production={t.producao_spice} tipo={tipo} />

              {/* Territory base shape */}
              <motion.path d={getTerritoryPath(px, py, outerR, seed)}
                fill={color} fillOpacity={isSelected ? 0.35 : isHovered ? 0.25 : 0.12}
                stroke={isSelected ? '#C4A35A' : isNeighbor && selectedTerritory ? 'hsl(38, 50%, 50%)' : color}
                strokeWidth={isSelected ? 3 : isHovered ? 2 : 1}
                filter={isSelected ? 'url(#glow-selected)' : isHovered ? 'url(#glow-hover)' : undefined}
                animate={{ scale: isSelected ? 1.1 : isHovered ? 1.04 : 1 }}
                style={{ transformOrigin: `${px}px ${py}px` }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }} />

              {/* Enemy red tint on hover */}
              {isHovered && isEnemy && (
                <path d={getTerritoryPath(px, py, outerR, seed)}
                  fill="hsl(0, 70%, 50%)" fillOpacity={0.12} pointerEvents="none" />
              )}

              {/* Faction banner */}
              {faction && t.dono_id && (
                <FactionBanner x={px} y={py} faction={faction} />
              )}

              {/* Troop pin (replaces old circle+number) */}
              <TroopPin
                x={px} y={py}
                forca={t.forca}
                faction={faction}
                isSelected={isSelected}
                defesaBase={t.defesa_base}
              />

              {/* Territory name */}
              <text x={px} y={py + outerR + 16} textAnchor="middle" fill="hsl(38, 25%, 70%)"
                fontSize="8" fontFamily="Cinzel, serif" letterSpacing="0.5">
                {t.nome}
              </text>

              {/* Spice production indicator */}
              <text x={px} y={py - outerR - 8} textAnchor="middle"
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
          const faction = getFaction(t.dono_id);
          const regiao = (t as any).regiao || def?.regiao || '';
          const tipo = (t as any).tipo || def?.tipo || 'comum';
          return (
            <motion.div key={hoveredTerritory}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
              className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 z-20 min-w-[200px]">
              <div className="flex items-center gap-2">
                {faction && <span className="text-sm">{faction.symbol}</span>}
                <h4 className="text-display text-primary text-sm tracking-wide">{t.nome}</h4>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">{REGION_NAMES[regiao] || regiao} · {tipo}</p>
              <div className="mt-1.5 space-y-0.5 text-xs font-body">
                <p className="text-foreground">Força: <span className="text-primary font-bold">{t.forca}</span></p>
                <p className="text-foreground">Defesa: <span className="font-bold">{t.defesa_base}</span></p>
                <p className="text-accent">⟡ Spice: {t.producao_spice}/turno</p>
                {owner && faction && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: owner.cor }} />
                    <span className="text-muted-foreground">
                      {owner.player_id === currentPlayerId ? 'Seu território' : faction.name}
                    </span>
                  </div>
                )}
                {!t.dono_id && <p className="text-muted-foreground">Neutro — sem bandeira</p>}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Legend panel */}
      <MapLegend playerEstados={playerEstados} />
    </div>
  );
}
