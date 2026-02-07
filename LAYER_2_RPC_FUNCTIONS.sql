-- ============================================
-- LAYER 2: RPC BACKUP FUNCTIONS
-- ============================================
-- Goal: Escape hatch if RLS fails
-- Modular: Separate functions for create/update, easy to test

-- Function 1: Admin Create Inquiry with Financials
CREATE OR REPLACE FUNCTION admin_create_inquiry_with_financials(
    p_inquiry_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_role text;
    v_result jsonb;
    v_inquiry_id uuid;
BEGIN
    -- Security: Check if caller is admin
    SELECT role INTO v_user_role
    FROM profiles
    WHERE id = auth.uid();
    
    IF v_user_role IS NULL OR v_user_role != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Only admin can use this function';
    END IF;
    
    -- Insert inquiry with all fields (SECURITY DEFINER bypasses RLS)
    INSERT INTO inquiries (
        user_id,
        customer_name,
        pic,
        industry,
        phone,
        email,
        origin,
        destination,
        weight,
        dimension,
        service_type,
        est_revenue,
        est_gp,
        est_commission,
        status,
        quote_status,
        packages,
        awb_number,
        shipment_date
    )
    VALUES (
        COALESCE((p_inquiry_data->>'user_id')::uuid, auth.uid()),
        p_inquiry_data->>'customer_name',
        p_inquiry_data->>'pic',
        p_inquiry_data->>'industry',
        p_inquiry_data->>'phone',
        p_inquiry_data->>'email',
        p_inquiry_data->>'origin',
        p_inquiry_data->>'destination',
        COALESCE((p_inquiry_data->>'weight')::numeric, 0),
        p_inquiry_data->>'dimension',
        p_inquiry_data->>'service_type',
        COALESCE((p_inquiry_data->>'est_revenue')::numeric, 0),
        COALESCE((p_inquiry_data->>'est_gp')::numeric, 0),
        COALESCE((p_inquiry_data->>'est_commission')::numeric, 0),
        COALESCE(p_inquiry_data->>'status', 'Profiling'),
        COALESCE(p_inquiry_data->>'quote_status', 'Pending'),
        COALESCE((p_inquiry_data->>'packages')::jsonb, '[]'::jsonb),
        p_inquiry_data->>'awb_number',
        (p_inquiry_data->>'shipment_date')::date
    )
    RETURNING id INTO v_inquiry_id;
    
    -- Return full inquiry data
    SELECT to_jsonb(inquiries.*) INTO v_result
    FROM inquiries
    WHERE id = v_inquiry_id;
    
    RETURN v_result;
END;
$$;

-- Function 2: Admin Update Inquiry Financials
CREATE OR REPLACE FUNCTION admin_update_inquiry_financials(
    p_inquiry_id uuid,
    p_est_revenue numeric DEFAULT NULL,
    p_est_gp numeric DEFAULT NULL,
    p_est_commission numeric DEFAULT NULL,
    p_awb_number text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_role text;
    v_result jsonb;
BEGIN
    -- Security: Check if caller is admin
    SELECT role INTO v_user_role
    FROM profiles
    WHERE id = auth.uid();
    
    IF v_user_role IS NULL OR v_user_role != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Only admin can use this function';
    END IF;
    
    -- Update inquiry (SECURITY DEFINER bypasses RLS)
    UPDATE inquiries
    SET
        est_revenue = COALESCE(p_est_revenue, est_revenue),
        est_gp = COALESCE(p_est_gp, est_gp),
        est_commission = COALESCE(p_est_commission, est_commission),
        awb_number = COALESCE(p_awb_number, awb_number),
        updated_at = NOW()
    WHERE id = p_inquiry_id;
    
    -- Return updated inquiry
    SELECT to_jsonb(inquiries.*) INTO v_result
    FROM inquiries
    WHERE id = p_inquiry_id;
    
    RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION admin_create_inquiry_with_financials(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_inquiry_financials(uuid, numeric, numeric, numeric, text) TO authenticated;

-- Verify functions created
SELECT 
    routine_name,
    routine_type,
    security_type,
    CASE 
        WHEN routine_name LIKE '%create%' THEN 'Backup for INSERT operations'
        WHEN routine_name LIKE '%update%' THEN 'Backup for UPDATE operations'
    END as purpose
FROM information_schema.routines
WHERE routine_name LIKE 'admin_%inquiry%'
AND routine_schema = 'public'
ORDER BY routine_name;

-- Expected: 2 functions (create, update) with DEFINER security
