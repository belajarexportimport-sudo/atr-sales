-- RPC: FORCE UPDATE FINANCIALS (Admin Only)
-- Bypasses RLS to ensure Revenue/GP/Commission can be updated by Admin.

CREATE OR REPLACE FUNCTION admin_update_financials(
    p_inquiry_id UUID,
    p_revenue NUMERIC DEFAULT NULL,
    p_gp NUMERIC DEFAULT NULL,
    p_commission NUMERIC DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Security Check: Must be Admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access Denied: You are not an authorized Admin.';
    END IF;

    -- Update Logic
    UPDATE inquiries
    SET 
        est_revenue = p_revenue,
        est_gp = p_gp,
        est_commission = p_commission
    WHERE id = p_inquiry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
