-- MASTER FIX: DEPLOY ALL MISSING FUNCTIONS
-- Run this script in Supabase SQL Editor to fix 404 Errors

-- 1. Fix "get_pending_users" (User Approval)
CREATE OR REPLACE FUNCTION get_pending_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE -- Fixed type to match Supabase timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.email,
    p.full_name,
    p.created_at
  FROM profiles p
  WHERE p.approved = FALSE
  ORDER BY p.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_pending_users() TO authenticated;


-- 2. Fix "get_pending_commissions" (Commission Logic)
-- Re-defining to be safe
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

GRANT EXECUTE ON FUNCTION get_pending_commissions() TO authenticated;


-- 3. Fix "get_pending_awb_requests" (AWB Logic)
CREATE OR REPLACE FUNCTION get_pending_awb_requests()
RETURNS TABLE (
  request_id UUID,
  inquiry_id UUID,
  customer_name TEXT,
  sales_name TEXT,
  sales_initial TEXT,
  requested_at TIMESTAMP
) AS $$
BEGIN
  -- Verify table exists first to avoid error if awb_requests table is missing
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'awb_requests') THEN
    RETURN QUERY
    SELECT 
      ar.id as request_id,
      ar.inquiry_id,
      i.customer_name,
      p.full_name as sales_name,
      ar.sales_initial,
      ar.requested_at
    FROM awb_requests ar
    JOIN inquiries i ON ar.inquiry_id = i.id
    JOIN profiles p ON ar.sales_rep_id = p.id
    WHERE ar.status = 'pending'
    ORDER BY ar.requested_at ASC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_pending_awb_requests() TO authenticated;

SELECT 'All missing functions deployed successfully!' as status;
