import type { GameLog as GameLogType } from '@/hooks/useGameState';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InfoHint } from '@/components/ui/InfoHint';

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
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-display text-primary text-lg">Log de Batalha</h3>
        <InfoHint title="NÍVEIS DE VISIBILIDADE">
          <p>Logs têm 3 níveis de visibilidade:</p>
          <p><span className="text-foreground font-semibold">Público</span> — todos veem (combates, conquistas, eventos).</p>
          <p><span className="text-sand-light font-semibold">Jogador</span> — só você vê (ações suas, espionagem).</p>
          <p><span className="text-muted-foreground font-semibold">Interno</span> — detalhes técnicos da resolução.</p>
        </InfoHint>
      </div>
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
