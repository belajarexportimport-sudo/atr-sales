CREATE OR REPLACE FUNCTION admin_create_inquiry_with_financials(p_inquiry_data jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_role text;
    v_result jsonb;
    v_inquiry_id uuid;
    v_target_user_id uuid;
BEGIN
    -- Security: Check if caller is admin
    SELECT role INTO v_user_role FROM profiles WHERE id = auth.uid();
    IF v_user_role IS NULL OR v_user_role != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Only admin can use this function';
    END IF;
    
    -- Extract user_id from payload, do NOT coerce to auth.uid() automatically if it's explicitly null/missing
    -- but if it's missing, use auth.uid() as fallback. 
    IF p_inquiry_data ? 'user_id' THEN
        IF p_inquiry_data->>'user_id' IS NULL THEN
            v_target_user_id := NULL;
        ELSE
            v_target_user_id := (p_inquiry_data->>'user_id')::uuid;
        END IF;
    ELSE
        v_target_user_id := auth.uid();
    END IF;

    -- Insert inquiry
    INSERT INTO inquiries (
        user_id, customer_name, pic, industry, phone, email, origin, destination, weight, dimension, service_type,
        est_revenue, est_gp, est_commission, status, quote_status, packages, awb_number, shipment_date
    ) VALUES (
        v_target_user_id,
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
