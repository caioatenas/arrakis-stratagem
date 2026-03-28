import { useMemo } from 'react';
import { TERRITORIES } from '@/lib/gameConstants';

interface ConnectionLinesProps {
  selectedTerritory: string | null;
  selectedNeighbors: Set<string>;
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

export function ConnectionLines({ selectedTerritory, selectedNeighbors }: ConnectionLinesProps) {
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

  const isHighlighted = (a: string, b: string) => {
    if (!selectedTerritory) return false;
    return (a === selectedTerritory && selectedNeighbors.has(b)) ||
           (b === selectedTerritory && selectedNeighbors.has(a));
  };

  return (
    <g>
      {connections.map(([a, b]) => {
        const pa = getPos(a);
        const pb = getPos(b);
        const highlighted = isHighlighted(a, b);
        const dimmed = selectedTerritory && !highlighted;
        return (
          <g key={`${a}-${b}`}>
            <path d={getBezierPath(pa.x, pa.y, pb.x, pb.y)}
              stroke={highlighted ? 'hsl(38, 60%, 55%)' : 'hsl(38, 30%, 30%)'}
              strokeWidth={highlighted ? 2.5 : 1}
              fill="none" strokeDasharray={highlighted ? '12,6' : '6,4'}
              opacity={dimmed ? 0.08 : highlighted ? 0.9 : 0.25}
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
    </g>
  );
}
