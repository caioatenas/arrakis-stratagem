import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Territory, PlayerEstado } from '@/hooks/useGameState';
import type { MovementFlow } from '@/hooks/useMovementFlow';
import { TERRITORIES, REGION_COLORS, REGION_NAMES } from '@/lib/gameConstants';
import { getFactionByColor, FACTIONS } from '@/lib/factions';
import { MapDefs } from './map/MapDefs';
import { ConnectionLines } from './map/ConnectionLines';
import { TroopPin } from './map/TroopPin';
import { FactionBanner } from './map/FactionBanner';
import { SpiceParticles } from './map/SpiceParticles';
import { WormExplosion } from './map/WormExplosion';
import { MovementAnimation } from './map/MovementAnimation';
import { HoverCombatPreview } from './map/HoverCombatPreview';
import { simulateCombat } from '@/lib/combatSimulation';
import mapBg from '@/assets/map-background.jpg';

interface TerritoryMapProps {
  territories: Territory[];
  playerEstados: PlayerEstado[];
  selectedTerritory: string | null;
  onSelectTerritory: (id: string) => void;
  currentPlayerId: string | null;
  movementFlow: MovementFlow;
  playerColor: string;
  onAnimationComplete: () => void;
  wormExplosionTarget?: string | null;
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

export function TerritoryMap({ territories, playerEstados, selectedTerritory, onSelectTerritory, currentPlayerId, movementFlow, playerColor, onAnimationComplete, wormExplosionTarget }: TerritoryMapProps) {
  const [hoveredTerritory, setHoveredTerritory] = useState<string | null>(null);
  const [strategicMode, setStrategicMode] = useState(false);

  const getFaction = (donoId: string | null) => {
    if (!donoId) return null;
    const pe = playerEstados.find(p => p.player_id === donoId);
    if (!pe) return null;
    if (pe.house) {
      return FACTIONS.find(f => f.id === pe.house) || null;
    }
    return getFactionByColor(pe.cor);
  };

  const getPlayerColor = (donoId: string | null) => {
    if (!donoId) return 'hsl(30, 12%, 35%)';
    const pe = playerEstados.find(p => p.player_id === donoId);
    return pe?.cor || '#555';
  };

  const displayTerritories = territories.length > 0 ? territories : TERRITORIES.map(t => ({
    ...t, partida_id: '', dono_id: null, forca: 50,
  }));

  const isInMoveMode = movementFlow.state === 'quantity_selected';
  const isAttackMode = isInMoveMode && movementFlow.actionType === 'atacar';
  const moveOriginNeighbors = useMemo(() => {
    if (!isInMoveMode || !movementFlow.originId) return new Set<string>();
    const t = TERRITORIES.find(t => t.id === movementFlow.originId);
    return new Set(t?.vizinhos || []);
  }, [isInMoveMode, movementFlow.originId]);

  const selectedNeighbors = useMemo(() => {
    if (isInMoveMode) return moveOriginNeighbors;
    if (!selectedTerritory) return new Set<string>();
    const t = TERRITORIES.find(t => t.id === selectedTerritory);
    return new Set(t?.vizinhos || []);
  }, [selectedTerritory, isInMoveMode, moveOriginNeighbors]);

  const effectiveSelected = isInMoveMode ? movementFlow.originId : selectedTerritory;

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

  // Hover preview line for destination during move mode
  const hoverPreviewLine = useMemo(() => {
    if (!isInMoveMode || !hoveredTerritory || !movementFlow.originId) return null;
    if (!moveOriginNeighbors.has(hoveredTerritory)) return null;
    // For attack mode, only show preview to enemy territories
    if (isAttackMode) {
      const ht = territories.find(t => t.id === hoveredTerritory);
      if (!ht || !ht.dono_id || ht.dono_id === currentPlayerId) return null;
    }
    const origin = TERRITORIES.find(t => t.id === movementFlow.originId);
    const dest = TERRITORIES.find(t => t.id === hoveredTerritory);
    if (!origin || !dest) return null;
    const mx = (origin.pos_x + dest.pos_x) / 2;
    const my = (origin.pos_y + dest.pos_y) / 2;
    const dx = dest.pos_x - origin.pos_x;
    const dy = dest.pos_y - origin.pos_y;
    const cx = mx - dy * 0.15;
    const cy = my + dx * 0.15;
    return { path: `M ${origin.pos_x} ${origin.pos_y} Q ${cx} ${cy} ${dest.pos_x} ${dest.pos_y}`, dest };
  }, [isInMoveMode, isAttackMode, hoveredTerritory, movementFlow.originId, moveOriginNeighbors, territories, currentPlayerId]);

  // Combat preview data for hover target in attack mode
  const hoverCombatData = useMemo(() => {
    if (!isAttackMode || !hoveredTerritory || !movementFlow.originId) return null;
    if (!moveOriginNeighbors.has(hoveredTerritory)) return null;
    const ht = territories.find(t => t.id === hoveredTerritory);
    if (!ht || !ht.dono_id || ht.dono_id === currentPlayerId) return null;
    const def = TERRITORIES.find(d => d.id === hoveredTerritory);
    if (!def) return null;
    const result = simulateCombat(movementFlow.quantity, ht.forca, ht.defesa_base, 100);
    return { x: def.pos_x, y: def.pos_y, result, defenderForce: ht.forca, defenseBase: ht.defesa_base };
  }, [isAttackMode, hoveredTerritory, movementFlow.originId, movementFlow.quantity, moveOriginNeighbors, territories, currentPlayerId]);

  return (
    <div className="relative w-full h-full min-h-[600px] rounded-xl overflow-hidden">
      <img src={mapBg} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'blur(2px)' }} />
      <div className="absolute inset-0 bg-background/65" />

      <svg viewBox="0 0 950 800" className="relative w-full h-full z-10" preserveAspectRatio="xMidYMid meet">
        <MapDefs />

        {regionLabels.map(({ regiao, x, y }) => (
          <text key={regiao} x={x} y={y} textAnchor="middle" fill={REGION_COLORS[regiao] || '#888'}
            fontSize="11" fontFamily="Cinzel, serif" letterSpacing="3" opacity={0.5}>
            {(REGION_NAMES[regiao] || regiao).toUpperCase()}
          </text>
        ))}

        <ConnectionLines selectedTerritory={effectiveSelected} selectedNeighbors={selectedNeighbors} />

        {/* Hover preview dashed line */}
        {hoverPreviewLine && (
          <g>
            <path d={hoverPreviewLine.path} fill="none"
              stroke={isAttackMode ? 'hsl(0, 70%, 50%)' : playerColor}
              strokeWidth={isAttackMode ? 3 : 2}
              strokeDasharray={isAttackMode ? '12,6' : '8,5'} opacity={0.6} filter="url(#glow-soft)" />
            <circle cx={hoverPreviewLine.dest.pos_x} cy={hoverPreviewLine.dest.pos_y} r={44}
              fill="none" stroke={isAttackMode ? 'hsl(0, 70%, 50%)' : playerColor}
              strokeWidth={1.5} strokeDasharray="6,4" opacity={0.35} />
          </g>
        )}

        {displayTerritories.map((t, idx) => {
          const def = TERRITORIES.find(d => d.id === t.id);
          const regiao = (t as any).regiao || def?.regiao || 'centro';
          const tipo = (t as any).tipo || def?.tipo || 'comum';
          const faction = getFaction(t.dono_id);
          const color = getPlayerColor(t.dono_id);
          const isSelected = effectiveSelected === t.id;
          const isHovered = hoveredTerritory === t.id;
          const isNeighbor = selectedNeighbors.has(t.id);
          const dimmed = effectiveSelected && !isSelected && !isNeighbor;
          const isEnemy = t.dono_id && t.dono_id !== currentPlayerId;
          const isMoveTarget = isInMoveMode && isNeighbor;
          const isAttackTarget = isAttackMode && isNeighbor && t.dono_id && t.dono_id !== currentPlayerId;
          const isMoveOnly = isMoveTarget && !isAttackMode && (!t.dono_id || t.dono_id === currentPlayerId);
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

              {!strategicMode && <SpiceParticles x={px} y={py} production={t.producao_spice} tipo={tipo} />}

              <motion.path d={getTerritoryPath(px, py, outerR, seed)}
                fill={color} fillOpacity={isSelected ? 0.35 : isAttackTarget && isHovered ? 0.35 : isMoveOnly && isHovered ? 0.3 : isHovered ? 0.25 : 0.12}
                stroke={isSelected ? '#C4A35A' : isAttackTarget ? 'hsl(0, 60%, 50%)' : isMoveOnly ? 'hsl(120, 40%, 50%)' : isNeighbor && effectiveSelected ? 'hsl(38, 50%, 50%)' : color}
                strokeWidth={isSelected ? 3 : isAttackTarget ? 2.5 : isMoveOnly ? 2 : isHovered ? 2 : 1}
                filter={isSelected ? 'url(#glow-selected)' : isAttackTarget && isHovered ? 'url(#glow-hover)' : isHovered ? 'url(#glow-hover)' : undefined}
                animate={{ scale: isSelected ? 1.1 : isHovered ? 1.04 : 1 }}
                style={{ transformOrigin: `${px}px ${py}px` }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }} />

              {isHovered && isEnemy && !isInMoveMode && (
                <path d={getTerritoryPath(px, py, outerR, seed)}
                  fill="hsl(0, 70%, 50%)" fillOpacity={0.12} pointerEvents="none" />
              )}

              {/* Green highlight for valid move targets */}
              {isMoveOnly && (
                <motion.path d={getTerritoryPath(px, py, outerR + 4, seed)}
                  fill="none" stroke="hsl(120, 40%, 50%)" strokeWidth={1.5} strokeDasharray="6,4"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5 }} />
              )}

              {/* Red pulsing highlight for attack targets */}
              {isAttackTarget && (
                <motion.path d={getTerritoryPath(px, py, outerR + 4, seed)}
                  fill="hsl(0, 60%, 50%)" fillOpacity={0.08}
                  stroke="hsl(0, 60%, 50%)" strokeWidth={2} strokeDasharray="8,4"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1 }} />
              )}

              {!strategicMode && faction && t.dono_id && (
                <FactionBanner x={px} y={py} faction={faction} />
              )}

              <TroopPin x={px} y={py} forca={t.forca} faction={faction} isSelected={isSelected} defesaBase={t.defesa_base} strategicMode={strategicMode} />

              {/* Territory name - smaller, below strength bar */}
              {!strategicMode && (
                <text x={px} y={py + outerR + 22} textAnchor="middle" fill="hsl(38, 25%, 60%)"
                  fontSize="6.5" fontFamily="Cinzel, serif" letterSpacing="0.3" opacity={0.8}>
                  {t.nome}
                </text>
              )}

              {/* Spice production - minimal icon */}
              {!strategicMode && (
                <text x={px + outerR - 2} y={py - outerR + 6} textAnchor="end"
                  fill={tipo === 'rico' ? 'hsl(45, 80%, 65%)' : 'hsl(210, 50%, 55%)'}
                  fontSize="7" fontFamily="Rajdhani, sans-serif" opacity={0.7}>
                  ⟡{t.producao_spice}
                </text>
              )}
            </g>
          );
        })}

        {/* Movement animation layer */}
        {movementFlow.state === 'animating' && movementFlow.originId && movementFlow.destinationId && (
          <MovementAnimation
            originId={movementFlow.originId}
            destinationId={movementFlow.destinationId}
            quantity={movementFlow.quantity}
            playerColor={playerColor}
            onComplete={onAnimationComplete}
          />
        )}

        {/* Worm explosion effect */}
        {wormExplosionTarget && (
          <WormExplosion targetId={wormExplosionTarget} onComplete={() => {}} />
        )}
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredTerritory && !effectiveSelected && !isInMoveMode && (() => {
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

      {/* Move mode indicator */}
      {isInMoveMode && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`absolute top-3 left-1/2 -translate-x-1/2 ${isAttackMode ? 'bg-destructive/90' : 'bg-primary/90'} text-primary-foreground px-4 py-1.5 rounded-full text-xs font-display tracking-widest z-20`}>
          {isAttackMode ? 'SELECIONE O ALVO' : 'SELECIONE O DESTINO'}
        </motion.div>
      )}

      {/* Strategic mode toggle */}
      <button
        onClick={() => setStrategicMode(s => !s)}
        className={`absolute bottom-3 right-3 z-20 px-3 py-1.5 rounded-lg text-xs font-display tracking-wider transition-all ${
          strategicMode
            ? 'bg-primary text-primary-foreground shadow-lg'
            : 'bg-card/80 text-muted-foreground border border-border hover:bg-card'
        }`}
      >
        {strategicMode ? '⚔ TÁTICO' : '👁 VISÃO TÁTICA'}
      </button>
    </div>
  );
}
