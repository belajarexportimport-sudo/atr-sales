-- FIX: GENERATE MISSING PROFILES
-- If a user exists in Authentication but NOT in the Profiles table, they won't show up in the Admin Dashboard.
-- This script finds them and creates their profiles.

DO $$
DECLARE
  r RECORD;
  v_count INT := 0;
BEGIN
  -- Loop through all Auth users who DO NOT have a Profile
  FOR r IN 
    SELECT * FROM auth.users 
    WHERE id NOT IN (SELECT id FROM public.profiles)
  LOOP
    RAISE NOTICE 'Creating missing profile for: %', r.email;
    
    INSERT INTO public.profiles (
      id, 
      email, 
      full_name, 
      role, 
      approved, 
      initials, 
      created_at
    )
    VALUES (
      r.id,
      r.email,
      -- Try to get name from metadata, fallback to email prefix
      COALESCE(r.raw_user_meta_data->>'full_name', split_part(r.email, '@', 1)),
      'sales',
      FALSE, -- Important: Set to FALSE so they show up in "Pending Approvals"
      UPPER(SUBSTRING(COALESCE(r.raw_user_meta_data->>'full_name', split_part(r.email, '@', 1)) FROM 1 FOR 2)),
      NOW()
    );
    
    v_count := v_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Fixed % missing profiles.', v_count;
END;
$$;

SELECT 'Check complete. Refresh your Admin Dashboard.' as status;
