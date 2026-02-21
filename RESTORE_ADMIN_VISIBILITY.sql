-- ========================================================
-- COMPREHENSIVE FIX: RESTORE ADMIN DASHBOARD VISIBILITY
-- ========================================================
-- TARGET ADMINS: aditatrexpress@gmail.com, arfaibow@gmail.com
-- This script fixes the "Blank Dashboard" issue for ALL admins.

-- STEP 1: CREATE A RECURSION-SAFE ADMIN CHECK
-- This function bypasses RLS to prevent infinite loops.
CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS BOOLEAN AS $$
DECLARE
    u_role text;
    is_super boolean;
BEGIN
    SELECT role, COALESCE(super_admin, FALSE) INTO u_role, is_super
    FROM public.profiles 
    WHERE id = auth.uid();
    
    RETURN (u_role = 'admin' OR is_super = TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 2: ENSURE ADMIN ROLES ARE CORRECT IN DATABASE
-- Making sure both recognized admins have the right flags
UPDATE public.profiles 
SET role = 'admin', approved = TRUE, super_admin = TRUE
WHERE email IN ('aditatrexpress@gmail.com', 'arfaibow@gmail.com');

-- STEP 3: RESET PROFILES RLS (RECURSION-FREE)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_view_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admin_view_all_profiles_safe" ON public.profiles;
DROP POLICY IF EXISTS "user_view_own_profile" ON public.profiles;

CREATE POLICY "user_view_own_profile" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (id = auth.uid());

CREATE POLICY "admin_view_all_profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (is_admin_safe());

-- STEP 4: RESET INQUIRIES RLS (RESTORE DASHBOARD DATA)
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_and_owner_select" ON public.inquiries;
DROP POLICY IF EXISTS "admin_select_all" ON public.inquiries;
DROP POLICY IF EXISTS "Enable read access for users" ON public.inquiries;
DROP POLICY IF EXISTS "Users can view inquiries based on role" ON public.inquiries;

CREATE POLICY "admin_and_owner_select_v2"
ON public.inquiries FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id        -- Owner can see
    OR
    user_id IS NULL             -- Shark Tank (Everyone can see)
    OR
    is_admin_safe()             -- Admin can see EVERYTHING
);

-- STEP 5: VERIFY
SELECT email, role, super_admin, is_admin_safe() as check_passed
FROM public.profiles 
WHERE email IN ('aditatrexpress@gmail.com', 'arfaibow@gmail.com');
