-- ============================================
-- ATR SALES PWA - COMPREHENSIVE STABILITY FIX
-- ============================================
-- 1. Create Safe Admin Check Function (Recursion-Safe)
-- 2. Update RLS Policies for Profiles, Inquiries, Leads
-- 3. Ensure Missing Indexes for Performance
-- 4. Unified Profile Logic (Failsafe)
-- ============================================

-- 1. RECURSION-SAFE ADMIN CHECK
CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS BOOLEAN AS $$
DECLARE
    u_role text;
    is_super boolean;
BEGIN
    -- SECURITY DEFINER allows this to bypass RLS on the profiles table itself
    SELECT role, COALESCE(super_admin, FALSE) INTO u_role, is_super
    FROM public.profiles 
    WHERE id = auth.uid();
    
    RETURN (u_role = 'admin' OR is_super = TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. INQUIRIES POLICIES (Consolidated)
DROP POLICY IF EXISTS "inquiries_access_v2" ON public.inquiries;
DROP POLICY IF EXISTS "admin_and_owner_select_v2" ON public.inquiries;
DROP POLICY IF EXISTS "admin_select_all" ON public.inquiries;

CREATE POLICY "inquiries_select_policy_v3"
ON public.inquiries FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()             -- Owner
    OR user_id IS NULL               -- Shark Tank
    OR is_admin_safe()               -- Admin/SuperAdmin
);

CREATE POLICY "inquiries_update_policy_v3"
ON public.inquiries FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()             -- Owner can update own
    OR is_admin_safe()               -- Admin can update anything
)
WITH CHECK (
    -- Admins can update any field, Sales can only update their own if not already won?
    -- Actually, simple check is best for now to avoid blocking sales from fixing errors.
    user_id = auth.uid()             
    OR is_admin_safe()
);

-- 3. PROFILES POLICIES
DROP POLICY IF EXISTS "profiles_select_v2" ON public.profiles;
CREATE POLICY "profiles_select_v3"
ON public.profiles FOR SELECT
TO authenticated
USING (
    id = auth.uid()                  -- Own profile
    OR is_admin_safe()               -- Admin sees all
);

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_inquiries_status_updated ON inquiries(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_status_v2 ON inquiries(user_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_user_id_v2 ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_approved ON profiles(role, approved);

-- 5. FAILSAFE PROFILE TRIGGER
-- Ensure email is always up to date from auth.users
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles 
    SET email = NEW.email
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_email();

-- SUCCESS MESSAGE
SELECT 'Comprehensive Stability Fix Applied Successfully!' as status;
