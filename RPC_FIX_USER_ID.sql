-- ALTERNATIVE FIX: Use RPC function instead of direct UPDATE
-- This bypasses Supabase client auth context completely

-- Step 1: Create RPC function that preserves user_id
CREATE OR REPLACE FUNCTION admin_update_revenue_preserve_owner(
    p_inquiry_id uuid,
    p_revenue numeric,
    p_gp numeric,
    p_commission numeric,
    p_awb text
) RETURNS void AS $$
BEGIN
    -- Update WITHOUT touching user_id
    UPDATE inquiries
    SET 
        est_revenue = p_revenue,
        est_gp = p_gp,
        est_commission = p_commission,
        awb_number = p_awb,
        updated_at = NOW()
        -- user_id is NOT in this UPDATE → stays unchanged!
    WHERE id = p_inquiry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Grant execute permission
GRANT EXECUTE ON FUNCTION admin_update_revenue_preserve_owner TO authenticated;

-- Step 3: Test the function
SELECT admin_update_revenue_preserve_owner(
    'PASTE-INQUIRY-ID-HERE'::uuid,
    8888888,  -- revenue
    7777777,  -- gp
    155555,   -- commission
    'TEST123' -- awb
);

-- Step 4: Verify user_id unchanged
SELECT id, customer_name, user_id, est_revenue, est_gp
FROM inquiries
WHERE id = 'PASTE-INQUIRY-ID-HERE'::uuid;

-- Expected: user_id unchanged, revenue updated
