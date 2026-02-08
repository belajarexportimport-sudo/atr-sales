-- STEP-BY-STEP RPC FIX (No manual ID needed)

-- Step 1: Create the RPC function
CREATE OR REPLACE FUNCTION admin_update_revenue_preserve_owner(
    p_inquiry_id uuid,
    p_revenue numeric,
    p_gp numeric,
    p_commission numeric,
    p_awb text
) RETURNS void AS $$
BEGIN
    UPDATE inquiries
    SET 
        est_revenue = p_revenue,
        est_gp = p_gp,
        est_commission = p_commission,
        awb_number = p_awb,
        updated_at = NOW()
    WHERE id = p_inquiry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Grant permission
GRANT EXECUTE ON FUNCTION admin_update_revenue_preserve_owner TO authenticated;

-- Step 3: Test with latest inquiry (auto-select)
DO $$
DECLARE
    v_inquiry_id uuid;
BEGIN
    -- Get latest inquiry ID
    SELECT id INTO v_inquiry_id
    FROM inquiries
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Update it
    PERFORM admin_update_revenue_preserve_owner(
        v_inquiry_id,
        9999999,  -- revenue
        8888888,  -- gp
        177777,   -- commission
        'RPC-TEST' -- awb
    );
    
    RAISE NOTICE 'Updated inquiry ID: %', v_inquiry_id;
END $$;

-- Step 4: Verify
SELECT 
    id,
    customer_name,
    user_id,
    est_revenue,
    est_gp,
    awb_number,
    updated_at
FROM inquiries
ORDER BY updated_at DESC
LIMIT 1;

-- Expected:
-- ✅ est_revenue = 9999999
-- ✅ user_id = (original, unchanged)
-- ✅ awb_number = 'RPC-TEST'
