import { FACTIONS } from '@/lib/factions';
import type { PlayerEstado } from '@/hooks/useGameState';

interface MapLegendProps {
  playerEstados: PlayerEstado[];
}

export function MapLegend({ playerEstados }: MapLegendProps) {
  return (
    <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 text-xs space-y-2">
      <h4 className="text-display text-primary text-[11px] tracking-wider uppercase">Legenda</h4>

      {/* Factions */}
      <div className="space-y-1">
        <p className="text-muted-foreground font-semibold">Casas</p>
        {playerEstados.map((pe, i) => {
          const faction = FACTIONS[i % FACTIONS.length];
          return (
            <div key={pe.id} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: pe.cor }} />
              <span className="text-foreground">{faction.name}</span>
              <span className="text-muted-foreground ml-auto">{faction.symbol}</span>
            </div>
          );
        })}
      </div>

      {/* Troop levels */}
      <div className="space-y-1 border-t border-border pt-1.5">
        <p className="text-muted-foreground font-semibold">Tropas</p>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/50" />
          <span className="text-foreground">1–20 leve</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-muted-foreground/70 ring-1 ring-muted-foreground/30" />
          <span className="text-foreground">21–60 médio</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-muted-foreground ring-2 ring-muted-foreground/30" />
          <span className="text-foreground">61+ forte</span>
        </div>
      </div>

      {/* Territory types */}
      <div className="space-y-1 border-t border-border pt-1.5">
        <p className="text-muted-foreground font-semibold">Territórios</p>
        <div className="flex items-center gap-1.5">
          <span className="text-accent">⟡</span>
          <span className="text-foreground">Spice (por turno)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>🛡</span>
          <span className="text-foreground">Alta defesa (7+)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-accent">✦</span>
          <span className="text-foreground">Território rico</span>
        </div>
      </div>
    </div>
  );
}
