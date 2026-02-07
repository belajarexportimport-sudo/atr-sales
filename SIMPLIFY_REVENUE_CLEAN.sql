-- ============================================
-- SIMPLIFIED REVENUE WORKFLOW - CLEAN VERSION
-- ============================================
-- This script will:
-- 1. Drop existing policies/functions if they exist
-- 2. Create new simplified functions
-- 3. Make revenue visible immediately (no approval needed)

-- ============================================
-- STEP 1: Clean Up Existing Policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "admin_full_update_access" ON inquiries;
DROP POLICY IF EXISTS "Admin can update revenue" ON inquiries;
DROP POLICY IF EXISTS "admin_edit_revenue" ON inquiries;

-- ============================================
-- STEP 2: Create New Admin Update Policy
-- ============================================

-- Allow admin to update inquiries anytime
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
-- STEP 3: Drop Existing Functions
-- ============================================

DROP FUNCTION IF EXISTS admin_update_revenue(UUID, NUMERIC, NUMERIC, NUMERIC);
DROP FUNCTION IF EXISTS admin_update_awb(UUID, TEXT);
DROP FUNCTION IF EXISTS admin_update_inquiry_financials(UUID, NUMERIC, NUMERIC, NUMERIC, TEXT);

-- ============================================
-- STEP 4: Create Simplified Revenue Function
-- ============================================

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
    
    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'revenue', p_revenue,
        'gp', p_gp,
        'commission', v_calculated_commission
    );
END;
$$;

-- ============================================
-- STEP 5: Create AWB Update Function
-- ============================================

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
-- STEP 6: Create Combined Update Function
-- ============================================

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
    
    -- Return success
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
-- STEP 7: Grant Permissions
-- ============================================

GRANT EXECUTE ON FUNCTION admin_update_revenue TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_awb TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_inquiry_financials TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check if functions created
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE 'admin_update%'
AND routine_schema = 'public';

-- Expected output:
-- admin_update_revenue
-- admin_update_awb
-- admin_update_inquiry_financials

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Revenue simplification complete!';
    RAISE NOTICE '✅ Admin can now edit revenue anytime';
    RAISE NOTICE '✅ Revenue will display immediately (no approval needed)';
    RAISE NOTICE '✅ Refresh your app (Ctrl + F5) to see changes';
END $$;
