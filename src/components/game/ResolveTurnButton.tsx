import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Zap } from 'lucide-react';
import type { WormEventData } from './WormEventOverlay';

interface Props {
  partidaId: string | null;
  turnoId: string | null;
  turnoAtual: number;
  onResolved: (wormEvent?: WormEventData) => void;
}

export function ResolveTurnButton({ partidaId, turnoId, turnoAtual, onResolved }: Props) {
  const [resolving, setResolving] = useState(false);

  const resolveTurn = async () => {
    if (!partidaId || !turnoId || resolving) return;
    setResolving(true);

    try {
      const { data, error } = await supabase.functions.invoke('resolve-turn', {
        body: { partida_id: partidaId, turno_id: turnoId },
      });

      if (error) {
        console.error('Error resolving turn:', error);
      }

      const wormEvent = data?.wormEvent as WormEventData | undefined;
      setResolving(false);
      onResolved(wormEvent);
    } catch (err) {
      console.error('Failed to resolve turn:', err);
      setResolving(false);
      onResolved();
    }
  };

  return (
    <Button
      onClick={resolveTurn}
      disabled={resolving}
      size="sm"
      className="font-display tracking-wider"
    >
      <Zap className="w-4 h-4 mr-1" />
      {resolving ? 'Resolvendo...' : 'Resolver Turno'}
    </Button>
  );
}
