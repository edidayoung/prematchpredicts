CREATE TABLE public.team_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_key text NOT NULL,
  event_id text NOT NULL UNIQUE,
  commence_time timestamptz NOT NULL,
  home_team text NOT NULL,
  away_team text NOT NULL,
  home_score numeric NOT NULL,
  away_score numeric NOT NULL,
  total numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX team_results_sport_time_idx ON public.team_results (sport_key, commence_time DESC);
CREATE INDEX team_results_home_idx ON public.team_results (home_team);
CREATE INDEX team_results_away_idx ON public.team_results (away_team);
GRANT SELECT ON public.team_results TO anon, authenticated;
GRANT ALL ON public.team_results TO service_role;
ALTER TABLE public.team_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Results are publicly readable" ON public.team_results FOR SELECT USING (true);