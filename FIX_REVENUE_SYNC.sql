-- FIX REVENUE SYNC LOOPHOLE
-- Update approve_quote to accept Revenue & GP updates directly.
-- This ensures that when Admin approves (and prices) a quote, the values are saved.

DROP FUNCTION IF EXISTS approve_quote(uuid, uuid);

CREATE OR REPLACE FUNCTION approve_quote(
    p_inquiry_id UUID, 
    p_approved_by UUID,
    p_revenue NUMERIC DEFAULT NULL, -- Optional update
    p_gp NUMERIC DEFAULT NULL       -- Optional update
)
RETURNS VOID AS $$
BEGIN
    UPDATE inquiries
    SET 
        quote_status = 'Approved',
        -- If p_revenue is provided, update it. Otherwise keep existing.
        est_revenue = COALESCE(p_revenue, est_revenue),
        est_gp = COALESCE(p_gp, est_gp),
        status = 'Proposal' -- Ensure it's in Proposal stage
    WHERE id = p_inquiry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
