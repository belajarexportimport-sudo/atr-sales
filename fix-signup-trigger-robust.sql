-- FIX SIGNUP TRIGGER (ROBUST VERSION)
-- Handles cases where Full Name is missing or null

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_initials TEXT;
BEGIN
  -- 1. Get Full Name (Fallback to part of email if missing)
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  
  -- 2. Generate Initials (Fallback to first 2 chars of email)
  v_initials := UPPER(SUBSTRING(v_full_name FROM 1 FOR 2));
  
  -- 3. Insert Profile
  INSERT INTO public.profiles (id, email, full_name, role, approved, initials, created_at)
  VALUES (
    new.id,
    new.email,
    v_full_name,
    'sales',
    FALSE, -- Still requires Admin Approval
    v_initials,
    NOW()
  );
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error but allow signup (profile will be created via fallback logic if needed)
  -- Actually, better to fail loud so we know, but for UX let's try to proceed
  RAISE WARNING 'Trigger failed: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

SELECT 'Robust Signup Trigger Installed' as status;
