import { useState, useCallback } from 'react';

export type MovementState =
  | 'idle'
  | 'origin_selected'
  | 'action_selected'
  | 'quantity_selected'
  | 'destination_selected'
  | 'confirming'
  | 'animating';

export interface MovementFlow {
  state: MovementState;
  originId: string | null;
  destinationId: string | null;
  quantity: number;
  maxQuantity: number;
  actionType: 'mover' | null;
}

export function useMovementFlow() {
  const [flow, setFlow] = useState<MovementFlow>({
    state: 'idle',
    originId: null,
    destinationId: null,
    quantity: 1,
    maxQuantity: 1,
    actionType: null,
  });

  const selectOrigin = useCallback((id: string, maxForce: number) => {
    const max = Math.max(1, Math.floor(maxForce / 2));
    setFlow({
      state: 'origin_selected',
      originId: id,
      destinationId: null,
      quantity: Math.ceil(max / 2),
      maxQuantity: max,
      actionType: null,
    });
  }, []);

  const selectAction = useCallback(() => {
    setFlow(prev => ({ ...prev, state: 'action_selected', actionType: 'mover' }));
  }, []);

  const setQuantity = useCallback((q: number) => {
    setFlow(prev => ({
      ...prev,
      quantity: Math.min(Math.max(1, q), prev.maxQuantity),
      state: 'action_selected',
    }));
  }, []);

  const confirmQuantity = useCallback(() => {
    setFlow(prev => ({ ...prev, state: 'quantity_selected' }));
  }, []);

  const selectDestination = useCallback((id: string) => {
    setFlow(prev => ({ ...prev, destinationId: id, state: 'confirming' }));
  }, []);

  const startAnimation = useCallback(() => {
    setFlow(prev => ({ ...prev, state: 'animating' }));
  }, []);

  const reset = useCallback(() => {
    setFlow({
      state: 'idle',
      originId: null,
      destinationId: null,
      quantity: 1,
      maxQuantity: 1,
      actionType: null,
    });
  }, []);

  return { flow, selectOrigin, selectAction, setQuantity, confirmQuantity, selectDestination, startAnimation, reset };
}
