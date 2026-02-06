-- FIX PENDING QUOTES RPC
-- Ensure est_revenue and est_gp are selected so Admin can see/edit them.

DROP FUNCTION IF EXISTS get_pending_quotes();

CREATE OR REPLACE FUNCTION get_pending_quotes()
RETURNS TABLE (
    inquiry_id UUID,
    created_at TIMESTAMPTZ,
    sales_rep TEXT,
    customer_name TEXT,
    est_revenue NUMERIC, -- Critical
    est_gp NUMERIC,      -- Critical
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
        i.est_revenue, -- Select existing value (even if 0)
        i.est_gp,
        i.origin,
        i.destination
    FROM inquiries i
    JOIN profiles p ON i.sales_id = p.id
    WHERE i.quote_status = 'Pending' -- Only show Pending requests
    ORDER BY i.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
