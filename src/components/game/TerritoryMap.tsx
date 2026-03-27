import { motion } from 'framer-motion';
import type { Territory, PlayerEstado } from '@/hooks/useGameState';
import { TERRITORIES } from '@/lib/gameConstants';

interface TerritoryMapProps {
  territories: Territory[];
  playerEstados: PlayerEstado[];
  selectedTerritory: string | null;
  onSelectTerritory: (id: string) => void;
  currentPlayerId: string | null;
}

export function TerritoryMap({ territories, playerEstados, selectedTerritory, onSelectTerritory, currentPlayerId }: TerritoryMapProps) {
  const getPlayerColor = (donoId: string | null) => {
    if (!donoId) return 'hsl(30, 12%, 25%)';
    const pe = playerEstados.find(p => p.player_id === donoId);
    return pe?.cor || '#555';
  };

  const isOwned = (t: Territory) => t.dono_id === currentPlayerId;

  // Use template positions if no territories loaded yet
  const displayTerritories = territories.length > 0 ? territories : TERRITORIES.map(t => ({
    ...t,
    partida_id: '',
    dono_id: null,
    forca: 50,
  }));

  // Build connections from template
  const connections: [string, string][] = [];
  const seen = new Set<string>();
  for (const t of TERRITORIES) {
    for (const v of t.vizinhos) {
      const key = [t.id, v].sort().join('-');
      if (!seen.has(key)) {
        seen.add(key);
        connections.push([t.id, v]);
      }
    }
  }

  const getPos = (id: string) => {
    const t = displayTerritories.find(t => t.id === id);
    return t ? { x: t.pos_x, y: t.pos_y } : { x: 0, y: 0 };
  };

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <svg viewBox="0 0 750 560" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 30px hsl(38, 40%, 20%))' }}>
        {/* Background */}
        <defs>
          <radialGradient id="mapBg" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="hsl(30, 20%, 12%)" />
            <stop offset="100%" stopColor="hsl(30, 20%, 6%)" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="750" height="560" fill="url(#mapBg)" rx="12" />

        {/* Connections */}
        {connections.map(([a, b]) => {
          const pa = getPos(a);
          const pb = getPos(b);
          return (
            <line
              key={`${a}-${b}`}
              x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              stroke="hsl(38, 30%, 30%)"
              strokeWidth="2"
              strokeDasharray="8,4"
              opacity={0.6}
            />
          );
        })}

        {/* Territories */}
        {displayTerritories.map((t) => {
          const color = getPlayerColor(t.dono_id);
          const isSelected = selectedTerritory === t.id;
          const owned = isOwned(t as Territory);

          return (
            <g key={t.id} onClick={() => onSelectTerritory(t.id)} className="cursor-pointer">
              {/* Territory circle */}
              <circle
                cx={t.pos_x} cy={t.pos_y} r={isSelected ? 48 : 42}
                fill={color}
                fillOpacity={0.25}
                stroke={isSelected ? '#C4A35A' : color}
                strokeWidth={isSelected ? 3 : 1.5}
                filter={isSelected ? 'url(#glow)' : undefined}
              />
              {/* Inner circle */}
              <circle
                cx={t.pos_x} cy={t.pos_y} r={20}
                fill={color}
                fillOpacity={0.5}
                stroke={color}
                strokeWidth={1}
              />
              {/* Force number */}
              <text
                x={t.pos_x} y={t.pos_y + 5}
                textAnchor="middle"
                fill="hsl(38, 30%, 90%)"
                fontSize="16"
                fontWeight="bold"
                fontFamily="Rajdhani, sans-serif"
              >
                {t.forca}
              </text>
              {/* Territory name */}
              <text
                x={t.pos_x} y={t.pos_y + 62}
                textAnchor="middle"
                fill="hsl(38, 25%, 65%)"
                fontSize="12"
                fontFamily="Cinzel, serif"
                letterSpacing="1"
              >
                {t.nome}
              </text>
              {/* Spice indicator */}
              <text
                x={t.pos_x} y={t.pos_y - 50}
                textAnchor="middle"
                fill="hsl(210, 70%, 60%)"
                fontSize="10"
                fontFamily="Rajdhani, sans-serif"
              >
                ⟡ {t.producao_spice}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
