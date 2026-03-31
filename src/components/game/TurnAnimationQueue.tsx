import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameLog } from '@/hooks/useGameState';
import { Swords, Move, Shield, Gem, Eye } from 'lucide-react';

interface TurnAnimationQueueProps {
  logs: GameLog[];
  turnoAtual: number;
  onComplete?: () => void;
}

interface AnimEvent {
  id: string;
  icon: React.ReactNode;
  message: string;
  color: string;
  type: string;
}

function parseLogToEvent(log: GameLog): AnimEvent | null {
  const msg = log.mensagem;
  if (msg.includes('Moveu')) {
    return { id: log.id, icon: <Move className="w-5 h-5" />, message: msg, color: 'hsl(var(--primary))', type: 'move' };
  }
  if (msg.includes('Combate') || msg.includes('conquistou')) {
    return { id: log.id, icon: <Swords className="w-5 h-5" />, message: msg, color: 'hsl(0, 70%, 50%)', type: 'attack' };
  }
  if (msg.includes('Fortificou')) {
    return { id: log.id, icon: <Shield className="w-5 h-5" />, message: msg, color: 'hsl(210, 60%, 55%)', type: 'fortify' };
  }
  if (msg.includes('Extraiu')) {
    return { id: log.id, icon: <Gem className="w-5 h-5" />, message: msg, color: 'hsl(45, 80%, 55%)', type: 'extract' };
  }
  if (msg.includes('Espionou')) {
    return { id: log.id, icon: <Eye className="w-5 h-5" />, message: msg, color: 'hsl(258, 70%, 60%)', type: 'spy' };
  }
  if (msg.includes('Verme') || msg.includes('Tempestade') || msg.includes('Superprodução') || msg.includes('Instabilidade')) {
    return { id: log.id, icon: <span className="text-lg">🪱</span>, message: msg, color: 'hsl(30, 60%, 50%)', type: 'event' };
  }
  return null;
}

export function TurnAnimationQueue({ logs, turnoAtual, onComplete }: TurnAnimationQueueProps) {
  const [queue, setQueue] = useState<AnimEvent[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [lastTurno, setLastTurno] = useState(0);

  // Build queue when new turn logs arrive
  useEffect(() => {
    if (turnoAtual <= lastTurno) return;
    
    const turnLogs = logs.filter(l => l.turno_numero === turnoAtual - 1 && l.nivel === 'publico');
    const events = turnLogs.map(parseLogToEvent).filter(Boolean) as AnimEvent[];
    
    if (events.length > 0) {
      setQueue(events);
      setCurrentIdx(0);
      setPlaying(true);
      setLastTurno(turnoAtual);
    }
  }, [turnoAtual, logs, lastTurno]);

  // Advance queue
  useEffect(() => {
    if (!playing || currentIdx >= queue.length) {
      if (playing) {
        setPlaying(false);
        onComplete?.();
      }
      return;
    }

    const timer = setTimeout(() => {
      setCurrentIdx(prev => prev + 1);
    }, 1800);

    return () => clearTimeout(timer);
  }, [currentIdx, queue, playing, onComplete]);

  const current = playing && currentIdx < queue.length ? queue[currentIdx] : null;

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-md shadow-2xl max-w-md"
            style={{
              borderColor: current.color,
              background: `linear-gradient(135deg, hsl(var(--card) / 0.95), hsl(var(--background) / 0.9))`,
              boxShadow: `0 0 20px ${current.color}40`,
            }}
          >
            <div style={{ color: current.color }}>{current.icon}</div>
            <p className="text-sm font-body text-foreground">{current.message}</p>
            <div className="text-[10px] text-muted-foreground font-body ml-2 whitespace-nowrap">
              {currentIdx + 1}/{queue.length}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}