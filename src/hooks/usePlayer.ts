import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Player {
  id: string;
  user_id: string;
  display_name: string;
  spice_total: number;
  games_played: number;
  games_won: number;
}

export function usePlayer(userId: string | undefined) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    
    const fetch = async () => {
      const { data } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', userId)
        .single();
      setPlayer(data as Player | null);
      setLoading(false);
    };
    fetch();
  }, [userId]);

  return { player, loading };
}
