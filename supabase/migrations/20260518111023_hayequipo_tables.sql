-- Create teams table if not exists
CREATE TABLE IF NOT EXISTS public.hayequipo_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS public.hayequipo_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.hayequipo_teams(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role = ANY (ARRAY['dt'::text, 'pf'::text, 'nutri'::text, 'jugador'::text])),
  number integer,
  position text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  health_status text DEFAULT 'disponible'::text,
  injury_description text,
  training_plan text,
  nutrition_plan text,
  weight numeric,
  target_weight numeric
);

-- Create matches table if not exists
CREATE TABLE IF NOT EXISTS public.hayequipo_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.hayequipo_teams(id) ON DELETE SET NULL,
  date timestamptz NOT NULL,
  rival text NOT NULL,
  location text NOT NULL,
  status text DEFAULT 'programado'::text,
  created_at timestamptz DEFAULT now()
);

-- Create convocations table if not exists
CREATE TABLE IF NOT EXISTS public.hayequipo_convocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES public.hayequipo_matches(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.hayequipo_profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pendiente'::text CHECK (status = ANY (ARRAY['pendiente'::text, 'confirmado'::text, 'rechazado'::text])),
  updated_at timestamptz DEFAULT now(),
  selected_for_match boolean DEFAULT false,
  position_x numeric,
  position_y numeric
);

-- Create announcements table if not exists
CREATE TABLE IF NOT EXISTS public.hayequipo_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  target_role text,
  created_by uuid REFERENCES public.hayequipo_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  type text DEFAULT 'standard'::text
);

-- Create nutrition objectives table if not exists
CREATE TABLE IF NOT EXISTS public.hayequipo_nutrition_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create nutrition recommendations table if not exists
CREATE TABLE IF NOT EXISTS public.hayequipo_nutrition_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  items text[] NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Grant USAGE on schema public to client roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, authenticator;

-- Grant ALL privileges on tables to client roles
GRANT ALL ON TABLE public.hayequipo_teams TO anon, authenticated, authenticator;
GRANT ALL ON TABLE public.hayequipo_profiles TO anon, authenticated, authenticator;
GRANT ALL ON TABLE public.hayequipo_matches TO anon, authenticated, authenticator;
GRANT ALL ON TABLE public.hayequipo_convocations TO anon, authenticated, authenticator;
GRANT ALL ON TABLE public.hayequipo_announcements TO anon, authenticated, authenticator;
GRANT ALL ON TABLE public.hayequipo_nutrition_objectives TO anon, authenticated, authenticator;
GRANT ALL ON TABLE public.hayequipo_nutrition_recommendations TO anon, authenticated, authenticator;

-- Disable Row Level Security on all hayequipo tables
ALTER TABLE public.hayequipo_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hayequipo_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hayequipo_matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hayequipo_convocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hayequipo_announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hayequipo_nutrition_objectives DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hayequipo_nutrition_recommendations DISABLE ROW LEVEL SECURITY;

-- Seed Teams
INSERT INTO public.hayequipo_teams (id, name, created_at) VALUES
('e0d3e922-9070-4754-a53d-47c5417f65d2', 'Hay Equipo FC', '2026-05-14 12:31:44.74658+00')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Seed Profiles
INSERT INTO public.hayequipo_profiles (id, team_id, full_name, email, role, number, position, avatar_url, created_at, health_status, injury_description, training_plan, nutrition_plan, weight, target_weight) VALUES
('11111111-1111-1111-1111-111111111111', 'e0d3e922-9070-4754-a53d-47c5417f65d2', 'Caruso Lombardi', 'caruso@hayequipo.com', 'dt', null, null, null, '2026-05-14 12:31:44.74658+00', 'disponible', null, null, null, null, null),
('33333333-3333-3333-3333-333333333333', 'e0d3e922-9070-4754-a53d-47c5417f65d2', 'Elo Podcast', 'elo@hayequipo.com', 'nutri', null, null, null, '2026-05-14 12:31:44.74658+00', 'disponible', null, null, null, null, null),
('44444444-4444-4444-4444-444444444444', 'e0d3e922-9070-4754-a53d-47c5417f65d2', 'Lucas Janson', 'janson@hayequipo.com', 'pf', null, null, null, '2026-05-14 12:31:44.74658+00', 'disponible', null, null, null, null, null),
('22222222-2222-2222-2222-222222222222', 'e0d3e922-9070-4754-a53d-47c5417f65d2', 'Michael Olise', 'olise@hayequipo.com', 'jugador', 10, 'Enganche', null, '2026-05-14 12:31:44.74658+00', 'disponible', null, null, null, null, null),
('97891f2f-b2bb-4ffa-853e-915238584ec9', 'e0d3e922-9070-4754-a53d-47c5417f65d2', 'Lionel Messi', 'messi@afa.com', 'jugador', 10, 'Delantero', null, '2026-05-14 12:31:44.74658+00', 'disponible', null, null, null, null, null),
('0e53b313-6c49-4809-963f-054bd6eafb55', 'e0d3e922-9070-4754-a53d-47c5417f65d2', 'Emiliano Martinez', 'dibu@afa.com', 'jugador', 23, 'Arquero', null, '2026-05-14 12:31:44.74658+00', 'disponible', null, null, null, null, null),
('43aa146b-f564-4ef5-a451-52ff1d486e12', 'e0d3e922-9070-4754-a53d-47c5417f65d2', 'Rodrigo De Paul', 'depaul@afa.com', 'jugador', 7, 'Mediocampista', null, '2026-05-14 12:31:44.74658+00', 'disponible', null, null, null, null, null),
('a6dc1ec6-15d6-4c81-90dc-e51f5b1a7e6f', 'e0d3e922-9070-4754-a53d-47c5417f65d2', 'Julian Alvarez', 'araña@afa.com', 'jugador', 9, 'Delantero', null, '2026-05-14 12:31:44.74658+00', 'disponible', null, null, null, null, null),
('56aeba36-1c92-41a8-8c70-e3d6be9f79b6', 'e0d3e922-9070-4754-a53d-47c5417f65d2', 'Alexis Mac Allister', 'alexis@afa.com', 'jugador', 20, 'Mediocampista', null, '2026-05-14 12:31:44.74658+00', 'disponible', null, null, null, null, null),
('2ce62c1b-3ae0-4564-bd0b-3eacedb1bc93', 'e0d3e922-9070-4754-a53d-47c5417f65d2', 'Enzo Fernandez', 'enzo@afa.com', 'jugador', 24, 'Mediocampista', null, '2026-05-14 12:31:44.74658+00', 'disponible', null, null, null, null, null),
('dd32899d-48cd-486c-92a9-8a67b4eee8e5', 'e0d3e922-9070-4754-a53d-47c5417f65d2', 'Cristian Romero', 'cuti@afa.com', 'jugador', 13, 'Defensor', null, '2026-05-14 12:31:44.74658+00', 'disponible', null, null, null, null, null),
('bb2b91e9-85b6-4aaf-9e47-ca692d5ef2e5', 'e0d3e922-9070-4754-a53d-47c5417f65d2', 'Lisandro Martinez', 'licha@afa.com', 'jugador', 25, 'Defensor', null, '2026-05-14 12:31:44.74658+00', 'disponible', null, null, null, null, null),
('15d41b3b-49a6-49ff-a248-25b7b86397b8', 'e0d3e922-9070-4754-a53d-47c5417f65d2', 'Nahuel Molina', 'nahuel@afa.com', 'jugador', 26, 'Defensor', null, '2026-05-14 12:31:44.74658+00', 'disponible', null, null, null, null, null),
('625afef8-1356-4a76-8b68-15d30c66ebd2', 'e0d3e922-9070-4754-a53d-47c5417f65d2', 'Nicolas Tagliafico', 'taglia@afa.com', 'jugador', 3, 'Defensor', null, '2026-05-14 12:31:44.74658+00', 'disponible', null, null, null, null, null),
('7c9c5aab-4dcf-4641-9a5d-bda1acf81404', 'e0d3e922-9070-4754-a53d-47c5417f65d2', 'Angel Di Maria', 'fideo@afa.com', 'jugador', 11, 'Delantero', null, '2026-05-14 12:31:44.74658+00', 'disponible', null, null, null, null, null),
('1dbacbcb-1143-4ca9-b93a-4babc26c357d', 'e0d3e922-9070-4754-a53d-47c5417f65d2', 'Lautaro Martinez', 'toro@afa.com', 'jugador', 22, 'Delantero', null, '2026-05-14 12:31:44.74658+00', 'disponible', null, null, null, null, null),
('d57dabc2-b4f5-4167-8300-c358ed657a57', 'e0d3e922-9070-4754-a53d-47c5417f65d2', 'Paulo Dybala', 'joya@afa.com', 'jugador', 21, 'Delantero', null, '2026-05-14 12:31:44.74658+00', 'disponible', null, null, null, null, null),
('d9df307f-40b5-42a7-9959-7d9ac5cc267f', 'e0d3e922-9070-4754-a53d-47c5417f65d2', 'Leandro Paredes', 'lea@afa.com', 'jugador', 5, 'Mediocampista', null, '2026-05-14 12:31:44.74658+00', 'disponible', null, null, null, null, null),
('66973334-dd25-48b2-874c-7974e21c8230', 'e0d3e922-9070-4754-a53d-47c5417f65d2', 'Marcos Acuña', 'huevo@afa.com', 'jugador', 8, 'Defensor', null, '2026-05-14 12:31:44.74658+00', 'disponible', null, null, null, null, null),
('7d23ef28-8bda-44d7-8725-5293532212ca', 'e0d3e922-9070-4754-a53d-47c5417f65d2', 'Gonzalo Montiel', 'cachete@afa.com', 'jugador', 4, 'Defensor', null, '2026-05-14 12:31:44.74658+00', 'disponible', null, null, null, null, null),
('56ca1adb-e526-4a9b-b0a1-ac3a4c61b54e', 'e0d3e922-9070-4754-a53d-47c5417f65d2', 'Nicolas Otamendi', 'general@afa.com', 'jugador', 19, 'Defensor', null, '2026-05-14 12:31:44.74658+00', 'disponible', null, null, null, null, null)
ON CONFLICT (id) DO UPDATE SET 
  team_id = EXCLUDED.team_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  number = EXCLUDED.number,
  position = EXCLUDED.position,
  health_status = EXCLUDED.health_status;

-- Seed Announcements
INSERT INTO public.hayequipo_announcements (id, title, content, target_role, created_by, created_at) VALUES
('d62fe310-5424-417e-91d2-8042e361045c', 'Cambio de cancha', 'Chicos, el partido del sábado se juega en la cancha 3 de césped sintético. Lleven el calzado adecuado.', 'jugador', '11111111-1111-1111-1111-111111111111', '2026-05-18 10:45:47.820485+00')
ON CONFLICT (id) DO NOTHING;

-- Seed Nutrition Objectives
INSERT INTO public.hayequipo_nutrition_objectives (id, title, description, category, created_at) VALUES
('0ea51b47-0383-44c2-865d-61eb25a76f49', 'Hidratación', '500ml extras por cada hora de entrenamiento.', 'hydration', '2026-05-18 10:45:47.820485+00'),
('f5bc5193-1bba-48aa-a5ef-da4b5e806ab8', 'Recuperación', 'Consumir proteína dentro de los 45 min post esfuerzo.', 'protein', '2026-05-18 10:45:47.820485+00')
ON CONFLICT (id) DO NOTHING;

-- Seed Nutrition Recommendations
INSERT INTO public.hayequipo_nutrition_recommendations (id, type, title, items, created_at) VALUES
('a6d33ccc-dcf8-491c-b64d-4bb323139e85', 'pre-match', 'Desayuno Pre-Partido', ARRAY['Avena con banana','2 tostadas con miel','Jugo de naranja'], '2026-05-18 10:45:47.820485+00'),
('70dc5251-ef4f-4ffe-9774-2cf5e0be7e4f', 'post-match', 'Cena de Recuperación', ARRAY['Pollo a la plancha','Arroz blanco','Ensalada de hojas verdes'], '2026-05-18 10:45:47.820485+00')
ON CONFLICT (id) DO NOTHING;
