-- FIX COLUMN NAME MISMATCH (sales_id -> user_id)
-- Error Log shows: column i.sales_id does not exist.
-- Changing to i.user_id.

DROP FUNCTION IF EXISTS get_pending_commissions();

CREATE OR REPLACE FUNCTION get_pending_commissions()
RETURNS TABLE (
    inquiry_id UUID,
    sales_rep TEXT,
    customer_name TEXT,
    est_revenue NUMERIC, 
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
    JOIN profiles p ON i.user_id = p.id -- FIXED: user_id NOT sales_id
    WHERE i.commission_status = 'Pending' 
      AND i.status != 'Cancelled'
    ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ALSO FIXING PENDING QUOTES JUST IN CASE
DROP FUNCTION IF EXISTS get_pending_quotes();

CREATE OR REPLACE FUNCTION get_pending_quotes()
RETURNS TABLE (
    inquiry_id UUID,
    created_at TIMESTAMPTZ,
    sales_rep TEXT,
    customer_name TEXT,
    est_revenue NUMERIC, 
    est_gp NUMERIC, 
    origin TEXT,
    destination TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.created_at,
        COALESCE(p.full_name, p.email) as sales_rep,
        i.customer_name,
        i.est_revenue, 
        i.est_gp,
        i.origin,
        i.destination
    FROM inquiries i
    JOIN profiles p ON i.user_id = p.id -- FIXED: user_id NOT sales_id
    WHERE i.quote_status = 'Pending' 
    ORDER BY i.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
