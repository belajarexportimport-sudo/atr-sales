-- FIX APPROVE COMMISSION (VERSION 3 - PARAM NAME FIX)
-- Error was: Could not find function ... (p_approved_by, ...)
-- Reason: We named it "p_admin_id", but Frontend sends "p_approved_by".
-- Fix: Rename parameter to match Frontend.

-- 1. DROP OLD VERSIONS
DROP FUNCTION IF EXISTS approve_commission(uuid, uuid, numeric);

-- 2. CREATE NEW ROBUST FUNCTION (With Correct Param Name)
CREATE OR REPLACE FUNCTION approve_commission(
    p_inquiry_id UUID,
    p_approved_by UUID, -- FIXED: Renamed from p_admin_id to match JS
    p_commission_amount NUMERIC
)
RETURNS VOID AS $$
BEGIN
    -- Update Inquiry Status
    UPDATE inquiries
    SET 
        commission_status = 'Approved',      
        commission_approved = TRUE,          
        commission_amount = p_commission_amount, 
        est_commission = p_commission_amount, -- Sync estimate too
        commission_approved_at = NOW(),
        commission_approved_by = p_approved_by -- Use new param name
    WHERE id = p_inquiry_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
