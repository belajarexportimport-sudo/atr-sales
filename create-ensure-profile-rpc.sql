-- SAFE PROFILE CREATION RPC
-- Called by Frontend if Profile is missing (Backup Plan)

CREATE OR REPLACE FUNCTION public.ensure_user_profile(
  p_full_name TEXT DEFAULT NULL
)
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
  -- 1. Get Current User ID (Secure)
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- 2. Check if Profile Exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = v_user_id) INTO v_exists;
  
  IF v_exists THEN
     RETURN jsonb_build_object('success', true, 'message', 'Profile already exists');
  END IF;

  -- 3. Get Email & Meta from Auth Table
  SELECT email, raw_user_meta_data->>'full_name' 
  INTO v_email, v_meta_name 
  FROM auth.users 
  WHERE id = v_user_id;

  -- 4. Determine Name (Param > Meta > Email)
  v_final_name := COALESCE(p_full_name, v_meta_name, split_part(v_email, '@', 1));
  
  -- 5. Generate Initials
  v_initials := UPPER(SUBSTRING(v_final_name FROM 1 FOR 2));

  -- 6. Insert Profile
  INSERT INTO public.profiles (id, email, full_name, role, approved, initials, created_at)
  VALUES (
    v_user_id,
    v_email,
    v_final_name,
    'sales',
    FALSE, -- Default to Pending
    v_initials,
    NOW()
  );

  RETURN jsonb_build_object('success', true, 'message', 'Profile created successfully');

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

SELECT 'Function ensure_user_profile created' as status;
