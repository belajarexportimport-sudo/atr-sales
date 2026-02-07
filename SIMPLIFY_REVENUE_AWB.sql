-- SIMPLIFIED WORKFLOW: Revenue & AWB
-- 1. Allow admin to edit revenue anytime (no approval needed)
-- 2. Revenue visible immediately after admin fills it
-- 3. AWB stays manual input (no auto-generation)

-- ============================================
-- PART 1: Update RLS Policies for Admin
-- ============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin can update revenue" ON inquiries;
DROP POLICY IF EXISTS "admin_edit_revenue" ON inquiries;

-- Create comprehensive admin update policy
CREATE POLICY "admin_full_update_access"
ON inquiries FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- ============================================
-- PART 2: Simplified Revenue Update Function
-- ============================================

-- Function for admin to update revenue directly
CREATE OR REPLACE FUNCTION admin_update_revenue(
    p_inquiry_id UUID,
    p_revenue NUMERIC,
    p_gp NUMERIC,
    p_commission NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_calculated_commission NUMERIC;
BEGIN
    -- Calculate commission if not provided (GP * 2%)
    IF p_commission IS NULL THEN
        v_calculated_commission := p_gp * 0.02;
    ELSE
        v_calculated_commission := p_commission;
    END IF;
    
    -- Update inquiry
    UPDATE inquiries
    SET 
        est_revenue = p_revenue,
        est_gp = p_gp,
        est_commission = v_calculated_commission,
        updated_at = NOW()
    WHERE id = p_inquiry_id;
    
    -- Return success with updated values
    RETURN jsonb_build_object(
        'success', true,
        'revenue', p_revenue,
        'gp', p_gp,
        'commission', v_calculated_commission
    );
END;
$$;

-- ============================================
-- PART 3: Simplified AWB Update Function
-- ============================================

-- Function for admin to update AWB directly
CREATE OR REPLACE FUNCTION admin_update_awb(
    p_inquiry_id UUID,
    p_awb_number TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate AWB format (optional)
    IF p_awb_number !~ '^ATR-[0-9]{4}-[0-9]{2}-[A-Z]{2,4}-[0-9]{3}$' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Invalid AWB format. Expected: ATR-YYYY-MM-ID-SEQ'
        );
    END IF;
    
    -- Check for duplicate AWB
    IF EXISTS (SELECT 1 FROM inquiries WHERE awb_number = p_awb_number AND id != p_inquiry_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'AWB number already exists'
        );
    END IF;
    
    -- Update inquiry
    UPDATE inquiries
    SET 
        awb_number = p_awb_number,
        updated_at = NOW()
    WHERE id = p_inquiry_id;
    
    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'awb_number', p_awb_number
    );
END;
$$;

-- ============================================
-- PART 4: Combined Update Function (Revenue + AWB)
-- ============================================

-- Function to update both revenue and AWB in one call
CREATE OR REPLACE FUNCTION admin_update_inquiry_financials(
    p_inquiry_id UUID,
    p_revenue NUMERIC DEFAULT NULL,
    p_gp NUMERIC DEFAULT NULL,
    p_commission NUMERIC DEFAULT NULL,
    p_awb_number TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_calculated_commission NUMERIC;
    v_update_count INTEGER := 0;
BEGIN
    -- Calculate commission if GP provided but commission not
    IF p_gp IS NOT NULL AND p_commission IS NULL THEN
        v_calculated_commission := p_gp * 0.02;
    ELSE
        v_calculated_commission := p_commission;
    END IF;
    
    -- Build dynamic update
    UPDATE inquiries
    SET 
        est_revenue = COALESCE(p_revenue, est_revenue),
        est_gp = COALESCE(p_gp, est_gp),
        est_commission = COALESCE(v_calculated_commission, est_commission),
        awb_number = COALESCE(p_awb_number, awb_number),
        updated_at = NOW()
    WHERE id = p_inquiry_id;
    
    GET DIAGNOSTICS v_update_count = ROW_COUNT;
    
    IF v_update_count = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Inquiry not found'
        );
    END IF;
    
    -- Return success with updated values
    RETURN jsonb_build_object(
        'success', true,
        'updated', jsonb_build_object(
            'revenue', p_revenue,
            'gp', p_gp,
            'commission', v_calculated_commission,
            'awb_number', p_awb_number
        )
    );
END;
$$;

-- ============================================
-- PART 5: Grant Permissions
-- ============================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION admin_update_revenue TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_awb TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_inquiry_financials TO authenticated;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Test: Check if admin can update revenue
-- SELECT admin_update_revenue(
--     'YOUR_INQUIRY_ID'::UUID,
--     10000000,  -- revenue
--     8000000,   -- gp
--     160000     -- commission (optional)
-- );

-- Test: Check if admin can update AWB
-- SELECT admin_update_awb(
--     'YOUR_INQUIRY_ID'::UUID,
--     'ATR-2026-02-AD-001'
-- );

-- Test: Update both at once
-- SELECT admin_update_inquiry_financials(
--     'YOUR_INQUIRY_ID'::UUID,
--     p_revenue := 10000000,
--     p_gp := 8000000,
--     p_awb_number := 'ATR-2026-02-AD-001'
-- );
