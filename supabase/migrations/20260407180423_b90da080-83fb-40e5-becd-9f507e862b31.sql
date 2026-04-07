
-- Drop the recursive SELECT policy
DROP POLICY IF EXISTS "Player estado viewable by game participants" ON player_estado;

-- Create a non-recursive SELECT policy using players table directly
CREATE POLICY "Player estado viewable by game participants"
ON player_estado
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM players p
    WHERE p.user_id = auth.uid()
      AND p.id IN (
        SELECT pe2.player_id FROM player_estado pe2 WHERE pe2.partida_id = player_estado.partida_id
      )
  )
);
