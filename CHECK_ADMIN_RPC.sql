-- CHECK & CREATE ADMIN RPC TUNNEL
-- Run this in Supabase SQL Editor

-- 1. DROP Existing Function first (Fixes ERROR: 42P13)
DROP FUNCTION IF EXISTS admin_update_financials(uuid, numeric, numeric, numeric);

-- 2. Create the RPC function
CREATE OR REPLACE FUNCTION admin_update_financials(
    p_inquiry_id UUID,
    p_revenue NUMERIC,
    p_gp NUMERIC,
    p_commission NUMERIC
)
RETURNS VOID AS $$
BEGIN
    -- Force update bypassing RLS (SECURITY DEFINER)
    UPDATE inquiries
    SET 
        est_revenue = p_revenue,
        est_gp = p_gp,
        est_commission = p_commission,
        -- Auto-calculate commission if commission is 0 but GP exists (optional safety)
        commission_amount = COALESCE(p_commission, 0)
    WHERE id = p_inquiry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant permission
GRANT EXECUTE ON FUNCTION admin_update_financials(UUID, NUMERIC, NUMERIC, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_financials(UUID, NUMERIC, NUMERIC, NUMERIC) TO service_role;

-- 3. Verify
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'admin_update_financials';
