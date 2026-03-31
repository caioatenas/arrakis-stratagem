
-- =============================================
-- FIX 1: acoes SELECT - only game participants can see actions
-- =============================================
DROP POLICY IF EXISTS "Acoes viewable" ON public.acoes;
CREATE POLICY "Acoes viewable by game participants"
  ON public.acoes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.player_estado pe
      JOIN public.players p ON pe.player_id = p.id
      WHERE pe.partida_id = acoes.partida_id
        AND p.user_id = auth.uid()
    )
  );

-- Also restrict INSERT to own player only
DROP POLICY IF EXISTS "Acoes insertable" ON public.acoes;
CREATE POLICY "Acoes insertable by own player"
  ON public.acoes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.players p
      WHERE p.id = acoes.player_id
        AND p.user_id = auth.uid()
    )
  );

-- =============================================
-- FIX 2: player_estado UPDATE - only own player
-- =============================================
DROP POLICY IF EXISTS "Player estado updatable" ON public.player_estado;
CREATE POLICY "Player estado updatable by own player"
  ON public.player_estado FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.players p
      WHERE p.id = player_estado.player_id
        AND p.user_id = auth.uid()
    )
  );

-- Also restrict INSERT to own player
DROP POLICY IF EXISTS "Player estado insertable" ON public.player_estado;
CREATE POLICY "Player estado insertable by own player"
  ON public.player_estado FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.players p
      WHERE p.id = player_estado.player_id
        AND p.user_id = auth.uid()
    )
  );

-- =============================================
-- FIX 3: partidas UPDATE - only host can update
-- =============================================
DROP POLICY IF EXISTS "Partidas updatable by authenticated" ON public.partidas;
CREATE POLICY "Partidas updatable by host"
  ON public.partidas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.players p
      WHERE p.id = partidas.host_id
        AND p.user_id = auth.uid()
    )
  );

-- =============================================
-- FIX 4: territorios UPDATE - no client updates allowed
-- (only edge function via service_role_key bypasses RLS)
-- =============================================
DROP POLICY IF EXISTS "Territorios updatable" ON public.territorios;
CREATE POLICY "Territorios updatable by owner only"
  ON public.territorios FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.players p
      WHERE p.id = territorios.dono_id
        AND p.user_id = auth.uid()
    )
  );

-- Restrict INSERT to game participants
DROP POLICY IF EXISTS "Territorios insertable" ON public.territorios;
CREATE POLICY "Territorios insertable by game host"
  ON public.territorios FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.partidas pa
      JOIN public.players p ON p.id = pa.host_id
      WHERE pa.id = territorios.partida_id
        AND p.user_id = auth.uid()
    )
  );

-- =============================================
-- FIX 5: turnos UPDATE - no client updates allowed
-- (only edge function via service_role_key)
-- =============================================
DROP POLICY IF EXISTS "Turnos updatable" ON public.turnos;
CREATE POLICY "Turnos updatable by game host"
  ON public.turnos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.partidas pa
      JOIN public.players p ON p.id = pa.host_id
      WHERE pa.id = turnos.partida_id
        AND p.user_id = auth.uid()
    )
  );

-- Restrict INSERT
DROP POLICY IF EXISTS "Turnos insertable" ON public.turnos;
CREATE POLICY "Turnos insertable by game host"
  ON public.turnos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.partidas pa
      JOIN public.players p ON p.id = pa.host_id
      WHERE pa.id = turnos.partida_id
        AND p.user_id = auth.uid()
    )
  );

-- =============================================
-- FIX 6: game_logs INSERT - restrict to own player or system
-- =============================================
DROP POLICY IF EXISTS "Logs insertable" ON public.game_logs;
CREATE POLICY "Logs insertable by game participant"
  ON public.game_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.player_estado pe
      JOIN public.players p ON pe.player_id = p.id
      WHERE pe.partida_id = game_logs.partida_id
        AND p.user_id = auth.uid()
    )
  );

-- =============================================
-- FIX 7: eventos INSERT - restrict to game participants
-- =============================================
DROP POLICY IF EXISTS "Eventos insertable" ON public.eventos;
CREATE POLICY "Eventos insertable by game participant"
  ON public.eventos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.player_estado pe
      JOIN public.players p ON pe.player_id = p.id
      WHERE pe.partida_id = eventos.partida_id
        AND p.user_id = auth.uid()
    )
  );
