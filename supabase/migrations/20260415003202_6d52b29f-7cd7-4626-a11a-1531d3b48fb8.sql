-- 1. Players: restrict SELECT to authenticated only
DROP POLICY IF EXISTS "Players viewable by all" ON public.players;
CREATE POLICY "Players viewable by authenticated" ON public.players
  FOR SELECT TO authenticated USING (true);

-- 2. Matchmaking queue: fix INSERT to verify ownership
DROP POLICY IF EXISTS "Queue insertable" ON public.matchmaking_queue;
CREATE POLICY "Queue insertable by own player" ON public.matchmaking_queue
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.players p
      WHERE p.id = matchmaking_queue.player_id AND p.user_id = auth.uid()
    )
  );

-- 3. Player estado: remove client UPDATE policy (only service role via edge function should update)
DROP POLICY IF EXISTS "Player estado updatable by own player" ON public.player_estado;