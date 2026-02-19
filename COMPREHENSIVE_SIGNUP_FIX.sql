-- FIX: COMPREHENSIVE SIGN UP REPAIR
-- Addresses issues where users sign up but no profile is created, or RLS blocks creation.

-- 1. Ensure Profiles Table is open for business
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. CRITICAL: Allow INSERT by the Trigger (and potentially fallback by public)
-- Even with SECURITY DEFINER, sometimes having an explicit policy helps debugging/client-inserts
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
CREATE POLICY "Enable insert for authenticated users only" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 3. RE-CREATE THE TRIGGER FUNCTION WITH SECURITY DEFINER
-- This ensures the function runs with admin privileges, bypassing RLS during Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_initials TEXT;
BEGIN
  -- Get Full Name (Fallback to part of email if missing)
  -- Try raw_user_meta_data, then metadata (legacy), then email
  v_full_name := COALESCE(
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );
  
  -- Generate Initials (First 2 chars of name, upper case)
  v_initials := UPPER(SUBSTRING(v_full_name FROM 1 FOR 2));
  
  -- Insert Profile (Safe Insert)
  -- We explicitly set approved = FALSE so they show up in Pending list
  INSERT INTO public.profiles (id, email, full_name, role, approved, initials, created_at)
  VALUES (
    new.id,
    new.email,
    v_full_name,
    'sales', -- Default role
    FALSE,   -- Default to NOT Approved
    v_initials,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email, -- Update email if changed (unlikely on create)
    full_name = EXCLUDED.full_name;
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Vital: Log error BUT DO NOT FAIL the transaction, or user auth fails too
  RAISE WARNING 'Signup Trigger Failed for %: %', new.id, SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- <--- CRITICAL: Runs as Superuser

-- 4. Re-bind the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. HEAL EXISTING: Create profiles for any users who signed up but have no profile
-- This fixes the "blocked" users from your recent failed attempts
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT * FROM auth.users 
    WHERE id NOT IN (SELECT id FROM public.profiles)
  LOOP
    INSERT INTO public.profiles (id, email, full_name, role, approved, initials, created_at)
    VALUES (
      r.id,
      r.email,
      COALESCE(r.raw_user_meta_data->>'full_name', split_part(r.email, '@', 1)),
      'sales',
      FALSE,
      UPPER(SUBSTRING(COALESCE(r.raw_user_meta_data->>'full_name', split_part(r.email, '@', 1)) FROM 1 FOR 2)),
      NOW()
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- 6. GRANT PERMISSIONS (Just in case)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.profiles TO anon, authenticated, service_role;
