import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Zap } from 'lucide-react';

interface Props {
  partidaId: string | null;
  turnoId: string | null;
  turnoAtual: number;
  onResolved: () => void;
}

export function ResolveTurnButton({ partidaId, turnoId, turnoAtual, onResolved }: Props) {
  const [resolving, setResolving] = useState(false);

  const resolveTurn = async () => {
    if (!partidaId || !turnoId || resolving) return;
    setResolving(true);

    try {
      // Invoke the edge function to resolve
      const { data, error } = await supabase.functions.invoke('resolve-turn', {
        body: { partida_id: partidaId, turno_id: turnoId },
      });

      if (error) console.error('Error resolving turn:', error);
    } catch (err) {
      console.error('Failed to resolve turn:', err);
    }

    setResolving(false);
    onResolved();
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
