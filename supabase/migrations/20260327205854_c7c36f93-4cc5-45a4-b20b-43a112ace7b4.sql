
-- Enum types
CREATE TYPE public.game_status AS ENUM ('waiting', 'in_progress', 'finished');
CREATE TYPE public.action_type AS ENUM ('mover', 'atacar', 'fortificar', 'espionar', 'extrair');
CREATE TYPE public.event_type AS ENUM ('tempestade', 'vermes', 'superproducao', 'instabilidade');
CREATE TYPE public.log_level AS ENUM ('interno', 'jogador', 'publico');

-- Players (profiles)
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT NOT NULL DEFAULT 'Fremen',
  spice_total INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  games_won INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players viewable by all" ON public.players FOR SELECT USING (true);
CREATE POLICY "Players can insert own" ON public.players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Players can update own" ON public.players FOR UPDATE USING (auth.uid() = user_id);

-- Partidas (matches)
CREATE TABLE public.partidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status game_status NOT NULL DEFAULT 'waiting',
  turno_atual INTEGER NOT NULL DEFAULT 0,
  max_jogadores INTEGER NOT NULL DEFAULT 4,
  vencedor_id UUID REFERENCES public.players(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partidas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partidas viewable by all" ON public.partidas FOR SELECT USING (true);
CREATE POLICY "Partidas insertable by authenticated" ON public.partidas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Partidas updatable by authenticated" ON public.partidas FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Player estado (player state per match)
CREATE TABLE public.player_estado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partida_id UUID NOT NULL REFERENCES public.partidas(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  spice INTEGER NOT NULL DEFAULT 0,
  acoes_restantes INTEGER NOT NULL DEFAULT 2,
  ativo BOOLEAN NOT NULL DEFAULT true,
  cor TEXT NOT NULL DEFAULT '#C4A35A',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(partida_id, player_id)
);

ALTER TABLE public.player_estado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Player estado viewable" ON public.player_estado FOR SELECT USING (true);
CREATE POLICY "Player estado insertable" ON public.player_estado FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Player estado updatable" ON public.player_estado FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Territorios
CREATE TABLE public.territorios (
  id TEXT NOT NULL,
  partida_id UUID NOT NULL REFERENCES public.partidas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  dono_id UUID REFERENCES public.players(id),
  forca INTEGER NOT NULL DEFAULT 50 CHECK (forca >= 0),
  producao_spice INTEGER NOT NULL DEFAULT 10,
  defesa_base INTEGER NOT NULL DEFAULT 5,
  vizinhos TEXT[] NOT NULL DEFAULT '{}',
  pos_x REAL NOT NULL DEFAULT 0,
  pos_y REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (id, partida_id)
);

ALTER TABLE public.territorios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Territorios viewable" ON public.territorios FOR SELECT USING (true);
CREATE POLICY "Territorios insertable" ON public.territorios FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Territorios updatable" ON public.territorios FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Turnos
CREATE TABLE public.turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partida_id UUID NOT NULL REFERENCES public.partidas(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  resolvido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  UNIQUE(partida_id, numero)
);

ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Turnos viewable" ON public.turnos FOR SELECT USING (true);
CREATE POLICY "Turnos insertable" ON public.turnos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Turnos updatable" ON public.turnos FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Acoes
CREATE TABLE public.acoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_id UUID NOT NULL REFERENCES public.turnos(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id),
  tipo action_type NOT NULL,
  origem_id TEXT,
  destino_id TEXT,
  quantidade INTEGER DEFAULT 0,
  partida_id UUID NOT NULL REFERENCES public.partidas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.acoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acoes viewable" ON public.acoes FOR SELECT USING (true);
CREATE POLICY "Acoes insertable" ON public.acoes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Eventos
CREATE TABLE public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_id UUID NOT NULL REFERENCES public.turnos(id) ON DELETE CASCADE,
  partida_id UUID NOT NULL REFERENCES public.partidas(id) ON DELETE CASCADE,
  tipo event_type NOT NULL,
  descricao TEXT NOT NULL,
  territorios_afetados TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Eventos viewable" ON public.eventos FOR SELECT USING (true);
CREATE POLICY "Eventos insertable" ON public.eventos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Logs
CREATE TABLE public.game_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partida_id UUID NOT NULL REFERENCES public.partidas(id) ON DELETE CASCADE,
  turno_numero INTEGER NOT NULL,
  nivel log_level NOT NULL DEFAULT 'publico',
  mensagem TEXT NOT NULL,
  dados JSONB DEFAULT '{}',
  player_id UUID REFERENCES public.players(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.game_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Logs viewable" ON public.game_logs FOR SELECT USING (true);
CREATE POLICY "Logs insertable" ON public.game_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Matchmaking queue
CREATE TABLE public.matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE UNIQUE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Queue viewable" ON public.matchmaking_queue FOR SELECT USING (true);
CREATE POLICY "Queue insertable" ON public.matchmaking_queue FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Queue deletable" ON public.matchmaking_queue FOR DELETE USING (auth.uid() IS NOT NULL);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.partidas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.territorios;
ALTER PUBLICATION supabase_realtime ADD TABLE public.turnos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_estado;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matchmaking_queue;

-- Function to auto-create player profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.players (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Fremen'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
