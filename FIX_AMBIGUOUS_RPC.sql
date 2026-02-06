-- NUKE AND REPAVE
-- Drop ALL variations (with or without arguments) to fix "Ambiguous Function" error.

DROP FUNCTION IF EXISTS get_pending_commissions();
DROP FUNCTION IF EXISTS get_pending_commissions(uuid); -- In case old version had args

-- Recreate CLEAN version
CREATE OR REPLACE FUNCTION get_pending_commissions()
RETURNS TABLE (
    inquiry_id UUID,
    sales_rep TEXT,
    customer_name TEXT,
    est_revenue NUMERIC, -- FIXED: Include Revenue
    est_gp NUMERIC,
    est_commission NUMERIC,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        COALESCE(p.full_name, p.email) as sales_rep,
        i.customer_name,
        i.est_revenue, 
        i.est_gp,
        i.est_commission,
        i.created_at
    FROM inquiries i
    JOIN profiles p ON i.sales_id = p.id
    WHERE i.commission_status = 'Pending' 
      AND i.status != 'Cancelled'
    ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
