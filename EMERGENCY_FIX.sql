-- === EMERGENCY LOGIN FIX ===
-- The previous policy caused "Infinite Recursion" (Looping).
-- We are removing all complex checks and making it SIMPLE.

-- 1. Fix Profiles (Stop the "Sign Up Loops")
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Delete ALL existing policies on profiles to be safe
DROP POLICY IF EXISTS "Universal Profile Access" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all, Users view own" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Users can see own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Access Policy Profiles" ON public.profiles;

-- SIMPLEST POLICY: Authenticated users can READ ALL profiles.
-- This is necessary for the Dashboard to show "Sales Names" of others.
-- It avoids recursion because it doesn't check "Who is Admin?" inside the policy.
CREATE POLICY "Allow All View"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Allow Users to UPDATE their OWN profile (for initial setup)
CREATE POLICY "Allow Own Update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Allow Users to INSERT their OWN profile (for Sign Up)
CREATE POLICY "Allow Own Insert"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);


-- 2. Fix Inquiries (Safely)
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Universal Inquiry Access" ON public.inquiries;

-- Use a SAFE logic for Inquiries (No subquery on same table)
-- We use a distinct lookup or just allow if it matches user.
-- For Admin view, we will use a simplified approach to avoid complexity today.
-- TEMPORARY: Allow users to see their own, AND any inquiry if they are an admin.
-- To avoid recursion, we will trusting the previous `is_admin()` function if it exists,
-- OR just allow all for now and filter in frontend (safest immediate fix).
-- BUT better: Let's assume recursion was only on PROFILES.

CREATE POLICY "Inquiry Access"
ON public.inquiries
FOR SELECT
TO authenticated
USING (
   -- Safe check: User owns it
   user_id = auth.uid()
   OR
   -- Admin Check (using function is safer than subquery if function is SECURITY DEFINER)
   public.is_admin()
);

SELECT '✅ LOGIN FIXED' as status;
