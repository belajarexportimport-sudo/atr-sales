-- FIX REVENUE SYNC FINAL
-- FORCE Drops potentially conflicting versions
DROP FUNCTION IF EXISTS approve_quote(uuid, uuid);
DROP FUNCTION IF EXISTS approve_quote(uuid, uuid, numeric, numeric);

-- Re-create with STRICT assignment (No Coalesce) and SECURITY DEFINER
CREATE OR REPLACE FUNCTION approve_quote(
    p_inquiry_id UUID, 
    p_approved_by UUID,
    p_revenue NUMERIC, -- Required
    p_gp NUMERIC       -- Required
)
RETURNS VOID AS $$
BEGIN
    UPDATE inquiries
    SET 
        quote_status = 'Approved',
        est_revenue = p_revenue, -- Force Update
        est_gp = p_gp,           -- Force Update
        status = 'Proposal'
    WHERE id = p_inquiry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
