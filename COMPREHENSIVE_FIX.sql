-- === MASTER FIX SCRIPT ===
-- Run this in Supabase SQL Editor to fix Data Visibility & Commission Issues

-- 1. UTILITY: Create Admin Check Function (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. PRIVACY: Fix Profiles Visibility (Admin sees all, User sees all for Name Mapping)
-- Note: We allow Users to see basic info of others for "Sales Name" mapping in shared tables, 
-- or we can restrict it. For now, let's allow "view own" + "Admins view all". 
-- BUT for the Dashboard "Sales Name" column to work for others (if ever needed) or simply to prevent errors,
-- we'll stick to Admin View All for now.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all, Users view own" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Users can see own profile only" ON public.profiles;

CREATE POLICY "Access Policy Profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  is_admin() OR auth.uid() = id
);

-- 3. PRIVACY: Fix Inquiries Visibility
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Users can view own inquiries" ON public.inquiries;

-- Single policy: If Admin OR Owner -> Access Granted
CREATE POLICY "Access Policy Inquiries"
ON public.inquiries FOR SELECT TO authenticated
USING (
  is_admin() OR auth.uid() = user_id
);

-- 4. DATA FIX: Unlock "Zero Commission" Records
-- Resets approved commissions that are 0 to 'Pending' so they can be recalculated
UPDATE public.inquiries
SET commission_status = 'Pending', commission_approved = false
WHERE (commission_status = 'Approved' OR commission_approved = true)
  AND (commission_amount = 0 OR commission_amount IS NULL);

-- 5. DATA FIX: Ensure Commission Amount is synced with Estimated if missing
UPDATE public.inquiries
SET commission_amount = est_commission
WHERE commission_amount IS NULL AND est_commission > 0;

SELECT '✅ MASTER FIX APPLIED SUCCESSFULLY' as result;
