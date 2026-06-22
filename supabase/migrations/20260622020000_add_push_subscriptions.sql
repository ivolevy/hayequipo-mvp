-- Create push subscriptions table
CREATE TABLE IF NOT EXISTS public.hayequipo_push_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid REFERENCES public.hayequipo_profiles(id) ON DELETE CASCADE,
    endpoint text UNIQUE NOT NULL,
    auth text NOT NULL,
    p256dh text NOT NULL,
    user_agent text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.hayequipo_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists and recreate
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public.hayequipo_push_subscriptions;

CREATE POLICY "Users can manage their own subscriptions" ON public.hayequipo_push_subscriptions
    FOR ALL
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);
