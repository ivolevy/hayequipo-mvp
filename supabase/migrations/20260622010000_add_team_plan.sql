-- Add plan column to teams with check constraint
ALTER TABLE public.hayequipo_teams ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free' CHECK (plan = ANY (ARRAY['free'::text, 'intermediate'::text, 'advanced'::text, 'premium'::text]));

-- Ensure the seed team is initialized with the 'free' plan so the demo starts in free tier
UPDATE public.hayequipo_teams SET plan = 'free' WHERE id = 'e0d3e922-9070-4754-a53d-47c5417f65d2';
