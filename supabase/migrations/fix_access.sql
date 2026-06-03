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
