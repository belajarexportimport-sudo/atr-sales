-- Drop existing functions first
DROP FUNCTION IF EXISTS admin_create_inquiry_with_financials(jsonb);
DROP FUNCTION IF EXISTS admin_update_inquiry_financials(uuid, numeric, numeric, numeric, text);

-- Function 1: Create inquiry with financials
CREATE FUNCTION admin_create_inquiry_with_financials(p_inquiry_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_role text;
    v_result jsonb;
    v_inquiry_id uuid;
BEGIN
    SELECT role INTO v_user_role FROM profiles WHERE id = auth.uid();
    
    IF v_user_role IS NULL OR v_user_role != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Only admin can use this function';
    END IF;
    
    INSERT INTO inquiries (
        user_id, customer_name, pic, industry, phone, email,
        origin, destination, weight, dimension, service_type,
        est_revenue, est_gp, est_commission,
        status, quote_status, packages, awb_number, shipment_date
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
    
    SELECT to_jsonb(inquiries.*) INTO v_result FROM inquiries WHERE id = v_inquiry_id;
    RETURN v_result;
END;
$$;

-- Function 2: Update inquiry financials
CREATE FUNCTION admin_update_inquiry_financials(
    p_inquiry_id uuid,
    p_revenue numeric DEFAULT NULL,
    p_gp numeric DEFAULT NULL,
    p_commission numeric DEFAULT NULL,
    p_awb text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_role text;
    v_result jsonb;
BEGIN
    SELECT role INTO v_user_role FROM profiles WHERE id = auth.uid();
    
    IF v_user_role IS NULL OR v_user_role != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Only admin can use this function';
    END IF;
    
    UPDATE inquiries
    SET
        est_revenue = COALESCE(p_revenue, est_revenue),
        est_gp = COALESCE(p_gp, est_gp),
        est_commission = COALESCE(p_commission, est_commission),
        awb_number = COALESCE(p_awb, awb_number),
        updated_at = NOW()
    WHERE id = p_inquiry_id;
    
    SELECT to_jsonb(inquiries.*) INTO v_result FROM inquiries WHERE id = p_inquiry_id;
    RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION admin_create_inquiry_with_financials(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_inquiry_financials(uuid, numeric, numeric, numeric, text) TO authenticated;
