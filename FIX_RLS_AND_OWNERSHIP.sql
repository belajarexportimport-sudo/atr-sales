-- === DATABASE FIX: Final Robust Ownership & Visibility Fix ===
-- This script fixes "Cannot Save" issues, preserves Owner, AND enables Shark Tank visibility.

-- 1. Ensure is_admin() function is robust
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Make user_id NULLABLE to support "Open Market" (unassigned) records
ALTER TABLE public.leads ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.inquiries ALTER COLUMN user_id DROP NOT NULL;

-- 3. Remove auto-setting Defaults (Double Lock Layer 1)
ALTER TABLE public.leads ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.inquiries ALTER COLUMN user_id DROP DEFAULT;

-- 4. Ownership Preservation Trigger (Double Lock Layer 2)
-- This FORCES user_id to stay the same on UPDATE
CREATE OR REPLACE FUNCTION handle_ownership_preservation()
RETURNS TRIGGER AS $$
BEGIN
  -- If update, keep original user_id unless it was NULL and we are now assigning it
  IF TG_OP = 'UPDATE' THEN
    -- If OLD was null and NEW has a value, allowed (claiming open lead)
    -- Otherwise, force NEW to match OLD
    IF OLD.user_id IS NOT NULL THEN
      NEW.user_id := OLD.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to Leads
DROP TRIGGER IF EXISTS preserve_lead_owner ON public.leads;
CREATE TRIGGER preserve_lead_owner
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION handle_ownership_preservation();

-- Apply to Inquiries
DROP TRIGGER IF EXISTS preserve_inquiry_owner ON public.inquiries;
CREATE TRIGGER preserve_inquiry_owner
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION handle_ownership_preservation();

-- 5. REPAIR RLS POLICIES (Fix "Cannot Save" and "Visibility" for Sales)

-- -- LEADS -- --
DROP POLICY IF EXISTS "Leads Select Policy" ON public.leads;
CREATE POLICY "Leads Select Policy" ON public.leads FOR SELECT TO authenticated
USING (is_admin() OR auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Leads Insert Policy" ON public.leads;
CREATE POLICY "Leads Insert Policy" ON public.leads FOR INSERT TO authenticated
WITH CHECK (is_admin() OR auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Leads Update Policy" ON public.leads;
CREATE POLICY "Leads Update Policy" ON public.leads FOR UPDATE TO authenticated
USING (is_admin() OR auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (is_admin() OR auth.uid() = user_id OR user_id IS NULL);

-- -- INQUIRIES -- --
DROP POLICY IF EXISTS "Inquiries Select Policy" ON public.inquiries;
CREATE POLICY "Inquiries Select Policy" ON public.inquiries FOR SELECT TO authenticated
USING (is_admin() OR auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Inquiries Insert Policy" ON public.inquiries;
CREATE POLICY "Inquiries Insert Policy" ON public.inquiries FOR INSERT TO authenticated
WITH CHECK (is_admin() OR auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Inquiries Update Policy" ON public.inquiries;
CREATE POLICY "Inquiries Update Policy" ON public.inquiries FOR UPDATE TO authenticated
USING (is_admin() OR auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (is_admin() OR auth.uid() = user_id OR user_id IS NULL);

-- 6. Cleanup old problematic triggers
DROP TRIGGER IF EXISTS set_user_id_trigger ON public.inquiries;
DROP TRIGGER IF EXISTS handle_inquiry_user ON public.inquiries;
DROP TRIGGER IF EXISTS before_inquiry_update ON public.inquiries;
DROP TRIGGER IF EXISTS preserve_user_id_trigger ON inquiries;

-- 7. Final Verification
SELECT table_name, column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name IN ('inquiries', 'leads') AND column_name = 'user_id';
