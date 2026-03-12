-- === DATABASE FIX: Lead Ownership & Admin Permissions ===
-- This script fixes RLS policies and removes problematic defaults/triggers

-- 1. Ensure is_admin() function exists and is robust
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FIX RLS: Allow Admins to UPDATE any inquiry/lead without being forced as owner
-- INQUIRIES Table
DROP POLICY IF EXISTS "Users can update own inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Access Policy Inquiries Update" ON public.inquiries;

CREATE POLICY "Access Policy Inquiries Update"
ON public.inquiries FOR UPDATE TO authenticated
USING (
  is_admin() OR auth.uid() = user_id
)
WITH CHECK (
  is_admin() OR auth.uid() = user_id OR user_id IS NULL
);

-- LEADS Table
DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;
DROP POLICY IF EXISTS "Access Policy Leads Update" ON public.leads;

CREATE POLICY "Access Policy Leads Update"
ON public.leads FOR UPDATE TO authenticated
USING (
  is_admin() OR auth.uid() = user_id
)
WITH CHECK (
  is_admin() OR auth.uid() = user_id OR user_id IS NULL
);

-- 3. FIX DEFAULTS: Remove auto-setting of user_id on column level
-- (This prevents the database from "filling in" the admin's ID if user_id is missing)
ALTER TABLE public.inquiries ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.leads ALTER COLUMN user_id DROP DEFAULT;

-- 4. FIX TRIGGERS: Drop any trigger that's "helpfully" setting user_id = auth.uid()
DROP TRIGGER IF EXISTS set_user_id_trigger ON public.inquiries;
DROP TRIGGER IF EXISTS handle_inquiry_user ON public.inquiries;
DROP TRIGGER IF EXISTS before_inquiry_update ON public.inquiries;

-- 5. VERIFY: Show the column status
SELECT column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_name IN ('inquiries', 'leads') AND column_name = 'user_id';
