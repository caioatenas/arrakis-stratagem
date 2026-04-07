
-- Create a security definer function to check game participation without recursion
CREATE OR REPLACE FUNCTION public.is_game_participant(_partida_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM player_estado pe
    JOIN players p ON p.id = pe.player_id
    WHERE pe.partida_id = _partida_id
      AND p.user_id = _user_id
  );
$$;

-- Drop the still-recursive policy
DROP POLICY IF EXISTS "Player estado viewable by game participants" ON player_estado;

-- Create clean non-recursive policy
CREATE POLICY "Player estado viewable by game participants"
ON player_estado
FOR SELECT
TO authenticated
USING (public.is_game_participant(player_estado.partida_id, auth.uid()));
