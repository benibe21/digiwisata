-- Create an application profile whenever a Supabase Auth user is created.
-- New accounts are intentionally restricted to PETUGAS until an administrator
-- promotes them in public.users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::text),
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'name', ''), split_part(COALESCE(NEW.email, NEW.id::text), '@', 1)),
    'PETUGAS'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill Auth users that were created before this migration.
INSERT INTO public.users (id, email, name, role)
SELECT
  auth_user.id,
  COALESCE(auth_user.email, auth_user.id::text),
  COALESCE(NULLIF(auth_user.raw_user_meta_data ->> 'name', ''), split_part(COALESCE(auth_user.email, auth_user.id::text), '@', 1)),
  'PETUGAS'
FROM auth.users AS auth_user
WHERE NOT EXISTS (
  SELECT 1 FROM public.users AS app_user WHERE app_user.id = auth_user.id
);
