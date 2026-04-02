
-- 1. Fix game_logs: private intelligence exposed publicly
DROP POLICY IF EXISTS "Logs viewable" ON game_logs;

CREATE POLICY "Public and internal logs for game participants"
  ON game_logs FOR SELECT
  TO authenticated
  USING (
    nivel IN ('publico', 'interno')
    AND EXISTS (
      SELECT 1 FROM player_estado pe
      JOIN players p ON pe.player_id = p.id
      WHERE pe.partida_id = game_logs.partida_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Player logs viewable by own player"
  ON game_logs FOR SELECT
  TO authenticated
  USING (
    nivel = 'jogador'
    AND EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = game_logs.player_id
        AND p.user_id = auth.uid()
    )
  );

-- 2. Fix eventos: any participant can inject events
DROP POLICY IF EXISTS "Eventos insertable by game participant" ON eventos;

CREATE POLICY "Eventos insertable by game host"
  ON eventos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM partidas pa
      JOIN players p ON p.id = pa.host_id
      WHERE pa.id = eventos.partida_id
        AND p.user_id = auth.uid()
    )
  );

-- 3. Fix matchmaking_queue: any user can delete any entry
DROP POLICY IF EXISTS "Queue deletable" ON matchmaking_queue;

CREATE POLICY "Queue deletable by owner"
  ON matchmaking_queue FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = matchmaking_queue.player_id
        AND p.user_id = auth.uid()
    )
  );

-- 4. Fix player_estado: public SELECT exposes spice/actions to opponents
DROP POLICY IF EXISTS "Player estado viewable" ON player_estado;

CREATE POLICY "Player estado viewable by game participants"
  ON player_estado FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM player_estado pe2
      JOIN players p ON pe2.player_id = p.id
      WHERE pe2.partida_id = player_estado.partida_id
        AND p.user_id = auth.uid()
    )
  );
