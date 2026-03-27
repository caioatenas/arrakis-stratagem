ALTER TABLE public.territorios ADD COLUMN IF NOT EXISTS regiao text NOT NULL DEFAULT 'centro';
ALTER TABLE public.territorios ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'comum';