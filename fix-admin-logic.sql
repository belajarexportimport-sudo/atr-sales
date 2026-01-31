-- Fix Admin Logic & Commission Features

-- 1. Auto-Approve & Admin Trigger
CREATE OR REPLACE FUNCTION public.handle_new_profile_auto_approve()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IN ('aditatrexpress@gmail.com', 'arfaibow@gmail.com') THEN
    NEW.approved := TRUE;
    NEW.role := 'admin';
    NEW.approved_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_auto_approve ON public.profiles;
CREATE TRIGGER on_profile_created_auto_approve
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_auto_approve();

-- Also update existing records just in case
UPDATE public.profiles
SET approved = TRUE, role = 'admin', approved_at = NOW()
WHERE email IN ('aditatrexpress@gmail.com', 'arfaibow@gmail.com');


-- 2. Fix Commission Formula Text (Display only, but important for clarity)
UPDATE public.commission_rules
SET formula_string = 'GP * 2%'
WHERE rule_name = 'Default Commission';

-- 3. Create function to get pending commissions
CREATE OR REPLACE FUNCTION get_pending_commissions()
RETURNS TABLE (
  inquiry_id UUID,
  sales_rep TEXT,
  customer_name TEXT,
  est_revenue DECIMAL,
  est_gp DECIMAL,
  est_commission DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id as inquiry_id,
    p.full_name as sales_rep,
    i.customer_name,
    i.est_revenue,
    i.est_gp,
    i.est_commission,
    i.created_at
  FROM inquiries i
  JOIN profiles p ON i.user_id = p.id
  WHERE i.est_commission > 0 
  AND (i.commission_approved IS NULL OR i.commission_approved = FALSE)
   ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update RLS to be Role-Based (Super Admin Access)
-- Add policies that allow admins to do everything. RLS combines policies with OR.

CREATE POLICY "Admins can view all leads" ON leads
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update all leads" ON leads
  FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete all leads" ON leads
  FOR DELETE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can view all inquiries" ON inquiries
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update all inquiries" ON inquiries
  FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete all inquiries" ON inquiries
  FOR DELETE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
