-- === DATABASE RECONCILIATION: Status Fix, Missing Columns & RLS ===
-- This script synchronizes DB constraints with the Frontend and fixes saving errors.

-- 1. FIX: Inquiries Status Constraint (Add 'Won - Verification at WHS')
ALTER TABLE public.inquiries DROP CONSTRAINT IF EXISTS inquiries_status_check;
ALTER TABLE public.inquiries ADD CONSTRAINT inquiries_status_check 
  CHECK (status IN ('Profiling', 'Proposal', 'Negotiation', 'Won', 'Won - Verification at WHS', 'Lost', 'Invoiced', 'Paid', 'Overdue'));

-- 2. FIX: Leads Status Constraint (Add 'Closed-Won')
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_status_check 
  CHECK (status IN ('Cold', 'Warm', 'Hot', 'Closed-Won'));

-- 3. FIX: Ensure all required columns exist (JSONB packages, etc.)
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS packages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS quote_status TEXT DEFAULT 'Draft';
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS commission_amount NUMERIC DEFAULT 0;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS commission_status TEXT DEFAULT 'Pending';

-- 4. FIX: Robust Admin Detection (Add email fallback)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND (role = 'admin' OR email = 'aditatrexpress@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RE-APPLY: Nullable user_id & Ownership Lock
ALTER TABLE public.leads ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.inquiries ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.leads ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.inquiries ALTER COLUMN user_id DROP DEFAULT;

-- Preservation Trigger
CREATE OR REPLACE FUNCTION handle_ownership_preservation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.user_id IS NOT NULL THEN
      NEW.user_id := OLD.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS preserve_lead_owner ON public.leads;
CREATE TRIGGER preserve_lead_owner BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION handle_ownership_preservation();

DROP TRIGGER IF EXISTS preserve_inquiry_owner ON public.inquiries;
CREATE TRIGGER preserve_inquiry_owner BEFORE UPDATE ON public.inquiries FOR EACH ROW EXECUTE FUNCTION handle_ownership_preservation();

-- 6. RE-APPLY: Permissive RLS Policies
DROP POLICY IF EXISTS "Leads Select Policy" ON public.leads;
CREATE POLICY "Leads Select Policy" ON public.leads FOR SELECT TO authenticated USING (is_admin() OR auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Leads Insert Policy" ON public.leads;
CREATE POLICY "Leads Insert Policy" ON public.leads FOR INSERT TO authenticated WITH CHECK (is_admin() OR auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Leads Update Policy" ON public.leads;
CREATE POLICY "Leads Update Policy" ON public.leads FOR UPDATE TO authenticated USING (is_admin() OR auth.uid() = user_id OR user_id IS NULL) WITH CHECK (is_admin() OR auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Inquiries Select Policy" ON public.inquiries;
CREATE POLICY "Inquiries Select Policy" ON public.inquiries FOR SELECT TO authenticated USING (is_admin() OR auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Inquiries Insert Policy" ON public.inquiries;
CREATE POLICY "Inquiries Insert Policy" ON public.inquiries FOR INSERT TO authenticated WITH CHECK (is_admin() OR auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Inquiries Update Policy" ON public.inquiries;
CREATE POLICY "Inquiries Update Policy" ON public.inquiries FOR UPDATE TO authenticated USING (is_admin() OR auth.uid() = user_id OR user_id IS NULL) WITH CHECK (is_admin() OR auth.uid() = user_id OR user_id IS NULL);

-- Final Check
SELECT 'Database Reconciled Successfully (Status Fix + RLS + Ownership)' as status;
