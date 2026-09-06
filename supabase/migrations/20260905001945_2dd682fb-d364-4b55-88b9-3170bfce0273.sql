CREATE TABLE public.daily_picks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pick_date DATE NOT NULL UNIQUE,
  sport_key TEXT NOT NULL,
  sport_title TEXT NOT NULL,
  event_id TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  commence_time TIMESTAMPTZ NOT NULL,
  selection TEXT NOT NULL,
  line NUMERIC NOT NULL,
  odds NUMERIC NOT NULL,
  bookmaker TEXT NOT NULL,
  confidence INTEGER NOT NULL DEFAULT 0,
  reasoning TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  final_total NUMERIC,
  stake NUMERIC NOT NULL DEFAULT 10,
  profit NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ
);

GRANT SELECT ON public.daily_picks TO anon;
GRANT SELECT ON public.daily_picks TO authenticated;
GRANT ALL ON public.daily_picks TO service_role;

ALTER TABLE public.daily_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Picks are publicly readable"
  ON public.daily_picks FOR SELECT
  USING (true);

CREATE INDEX daily_picks_date_idx ON public.daily_picks (pick_date DESC);