-- Add invite_code to teams
ALTER TABLE public.hayequipo_teams ADD COLUMN IF NOT EXISTS invite_code text UNIQUE;

-- Seed invite code for existing seed team if it doesn't have one
UPDATE public.hayequipo_teams SET invite_code = 'HAY123' WHERE id = 'e0d3e922-9070-4754-a53d-47c5417f65d2' AND invite_code IS NULL;

-- Create memberships table
CREATE TABLE IF NOT EXISTS public.hayequipo_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.hayequipo_profiles(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.hayequipo_teams(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role = ANY (ARRAY['dt'::text, 'pf'::text, 'nutri'::text, 'jugador'::text, 'admin'::text])),
  number integer,
  position text,
  health_status text DEFAULT 'disponible'::text CHECK (health_status = ANY (ARRAY['disponible'::text, 'duda'::text, 'lesionado'::text])),
  injury_description text,
  training_plan text,
  nutrition_plan text,
  weight numeric,
  target_weight numeric,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, team_id)
);

-- Grant privileges on new table
GRANT ALL ON TABLE public.hayequipo_memberships TO anon, authenticated, authenticator;
ALTER TABLE public.hayequipo_memberships DISABLE ROW LEVEL SECURITY;

-- Migrate existing profile data to memberships
INSERT INTO public.hayequipo_memberships (
  profile_id, team_id, role, number, position, health_status, injury_description, training_plan, nutrition_plan, weight, target_weight
)
SELECT 
  id, team_id, role, number, position, health_status, injury_description, training_plan, nutrition_plan, weight, target_weight
FROM public.hayequipo_profiles
ON CONFLICT (profile_id, team_id) DO NOTHING;

-- Create writable/updatable view for easier querying (hayequipo_squad)
CREATE OR REPLACE VIEW public.hayequipo_squad AS
SELECT 
  p.id as id,
  m.team_id,
  m.role,
  m.number,
  m.position,
  m.health_status,
  m.injury_description,
  m.training_plan,
  m.nutrition_plan,
  m.weight,
  m.target_weight,
  p.full_name,
  p.email,
  p.avatar_url,
  p.created_at
FROM public.hayequipo_memberships m
JOIN public.hayequipo_profiles p ON m.profile_id = p.id;

GRANT ALL ON TABLE public.hayequipo_squad TO anon, authenticated, authenticator;

-- Add team_id to announcements
ALTER TABLE public.hayequipo_announcements ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.hayequipo_teams(id) ON DELETE CASCADE;

-- Set default team_id for existing announcements
UPDATE public.hayequipo_announcements SET team_id = 'e0d3e922-9070-4754-a53d-47c5417f65d2' WHERE team_id IS NULL;
