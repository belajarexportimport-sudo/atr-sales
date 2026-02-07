-- FIX ALL OPERATIONS RPCs (Consolidated)
-- Helper to ensure clean slate
DROP FUNCTION IF EXISTS approve_quote(uuid, uuid);
DROP FUNCTION IF EXISTS approve_quote(uuid, uuid, numeric, numeric);
DROP FUNCTION IF EXISTS get_pending_quotes();
DROP FUNCTION IF EXISTS get_pending_commissions();

-- 1. APPROVE QUOTE (Fixes Revenue/GP update issue)
CREATE OR REPLACE FUNCTION approve_quote(
    p_inquiry_id UUID, 
    p_approved_by UUID,
    p_revenue NUMERIC, 
    p_gp NUMERIC
)
RETURNS VOID AS $$
BEGIN
    UPDATE inquiries
    SET 
        quote_status = 'Approved',
        est_revenue = p_revenue, -- Direct update
        est_gp = p_gp,           -- Direct update
        status = 'Proposal',
        commission_status = 'Pending' -- Ensure it enters commission queue
    WHERE id = p_inquiry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. GET PENDING QUOTES (Fixes missing Revenue column in select)
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
        COALESCE(i.est_revenue, 0) as est_revenue, -- Return 0 if null
        COALESCE(i.est_gp, 0) as est_gp,           -- Return 0 if null
        i.origin,
        i.destination
    FROM inquiries i
    LEFT JOIN profiles p ON i.user_id = p.id
    WHERE i.quote_status = 'Pending' 
    ORDER BY i.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. GET PENDING COMMISSIONS (Fixes missing Revenue column and user_id join)
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
        COALESCE(i.est_revenue, 0) as est_revenue, -- Ensure not null
        COALESCE(i.est_gp, 0) as est_gp,
        COALESCE(i.est_commission, 0) as est_commission,
        i.created_at
    FROM inquiries i
    LEFT JOIN profiles p ON i.user_id = p.id
    WHERE i.commission_status = 'Pending' 
      AND i.status != 'Cancelled'
    ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
