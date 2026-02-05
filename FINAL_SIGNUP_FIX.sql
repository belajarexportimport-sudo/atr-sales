-- FINAL SIGNUP FIX (COMPREHENSIVE)
-- Run this script to fix "Sign Up" issues once and for all.

-- 1. Ensure Profiles Table has all necessary columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS initials TEXT DEFAULT '??';

-- 2. Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Create Robust Signup Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_initials TEXT;
BEGIN
  -- Get Full Name (Fallback to part of email if missing)
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  
  -- Generate Initials (Fallback to first 2 chars of email)
  v_initials := UPPER(SUBSTRING(v_full_name FROM 1 FOR 2));
  
  -- Insert Profile (Safe Insert)
  INSERT INTO public.profiles (id, email, full_name, role, approved, initials, created_at)
  VALUES (
    new.id,
    new.email,
    v_full_name,
    'sales',
    FALSE, -- Sales require approval by default
    v_initials,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block auth (we have a healing RPC for this)
  RAISE WARNING 'Signup Trigger Failed: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-Attach Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Create "Self-Healing" RPC (Called by App if Profile is missing)
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_meta_name TEXT;
  v_final_name TEXT;
  v_initials TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Get context
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- Check existence
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = v_user_id) INTO v_exists;
  IF v_exists THEN
     RETURN jsonb_build_object('success', true, 'message', 'Profile exists');
  END IF;

  -- Get Auth Data
  SELECT email, raw_user_meta_data->>'full_name' 
  INTO v_email, v_meta_name 
  FROM auth.users 
  WHERE id = v_user_id;

  -- Prepare Data
  v_final_name := COALESCE(v_meta_name, split_part(v_email, '@', 1));
  v_initials := UPPER(SUBSTRING(v_final_name FROM 1 FOR 2));

  -- Insert
  INSERT INTO public.profiles (id, email, full_name, role, approved, initials, created_at)
  VALUES (v_user_id, v_email, v_final_name, 'sales', FALSE, v_initials, NOW());

  RETURN jsonb_build_object('success', true, 'message', 'Profile created');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- 6. ONE-TIME FIX: Heal any currently broken users
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
    );
  END LOOP;
END;
$$;

SELECT 'FINAL SIGNUP FIX COMPLETED' as status;
