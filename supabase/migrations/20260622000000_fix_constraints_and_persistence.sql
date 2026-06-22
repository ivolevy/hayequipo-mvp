-- Drop existing role constraint if it exists and create the updated one allowing 'admin'
ALTER TABLE public.hayequipo_profiles DROP CONSTRAINT IF EXISTS hayequipo_profiles_role_check;
ALTER TABLE public.hayequipo_profiles ADD CONSTRAINT hayequipo_profiles_role_check 
  CHECK (role = ANY (ARRAY['dt'::text, 'pf'::text, 'nutri'::text, 'jugador'::text, 'admin'::text]));

-- Add formation column to matches for tactical board persistence
ALTER TABLE public.hayequipo_matches ADD COLUMN IF NOT EXISTS formation text DEFAULT '4-3-3';

-- Add team_id to nutrition objectives and recommendations for isolation
ALTER TABLE public.hayequipo_nutrition_objectives ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.hayequipo_teams(id) ON DELETE CASCADE;
ALTER TABLE public.hayequipo_nutrition_recommendations ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.hayequipo_teams(id) ON DELETE CASCADE;

-- Default existing nutrition rows to the main demo team
UPDATE public.hayequipo_nutrition_objectives SET team_id = 'e0d3e922-9070-4754-a53d-47c5417f65d2' WHERE team_id IS NULL;
UPDATE public.hayequipo_nutrition_recommendations SET team_id = 'e0d3e922-9070-4754-a53d-47c5417f65d2' WHERE team_id IS NULL;
