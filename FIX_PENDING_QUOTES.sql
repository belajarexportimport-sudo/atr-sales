-- FIX PENDING QUOTES LOGIC
-- Include inquiries with Missing/Zero Revenue as "Pending Quotes" for Admin

DROP FUNCTION IF EXISTS get_pending_quotes;

CREATE OR REPLACE FUNCTION get_pending_quotes()
RETURNS TABLE (
    inquiry_id UUID,
    sales_rep TEXT,
    customer_name TEXT,
    est_revenue NUMERIC,
    est_gp NUMERIC,
    service_type TEXT,
    quote_status TEXT,
    created_at TIMESTAMPTZ,
    origin TEXT,
    destination TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id as inquiry_id,
        p.full_name as sales_rep,
        i.customer_name,
        i.est_revenue,
        i.est_gp,
        i.service_type,
        i.quote_status,
        i.created_at,
        i.origin,
        i.destination
    FROM inquiries i
    JOIN profiles p ON i.user_id = p.id
    WHERE 
        -- Criteria 1: Explicitly requested approval
        i.quote_status = 'Pending Approval' 
        OR 
        -- Criteria 2: Revenue is missing/zero (needs pricing) AND Inquiry is Active
        ((i.est_revenue IS NULL OR i.est_revenue = 0) 
         AND i.status NOT IN ('Lost', 'Cancelled', 'Overdue', 'Won', 'Invoiced', 'Paid'))
    ORDER BY i.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
