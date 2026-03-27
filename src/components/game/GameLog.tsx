import type { GameLog as GameLogType } from '@/hooks/useGameState';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GameLogProps {
  logs: GameLogType[];
}

export function GameLog({ logs }: GameLogProps) {
  const getLogColor = (nivel: string) => {
    switch (nivel) {
      case 'interno': return 'text-muted-foreground';
      case 'jogador': return 'text-sand-light';
      case 'publico': return 'text-foreground';
      default: return 'text-foreground';
    }
  };

  return (
    <div className="border-glow rounded-lg p-4">
      <h3 className="text-display text-primary text-lg mb-3">Log de Batalha</h3>
      <ScrollArea className="h-[200px]">
        <div className="space-y-1">
          {logs.length === 0 && (
            <p className="text-muted-foreground text-sm italic">Aguardando início da partida...</p>
          )}
          {logs.map(log => (
            <div key={log.id} className={`text-xs font-body ${getLogColor(log.nivel)}`}>
              <span className="text-muted-foreground mr-2">T{log.turno_numero}</span>
              {log.mensagem}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
