-- SEQUENCE FOR AWB (Thread-Safe)
CREATE SEQUENCE IF NOT EXISTS global_awb_seq START 1;

CREATE OR REPLACE FUNCTION public.approve_awb_request(p_request_id UUID, p_approved_by UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inquiry_id UUID;
  v_awb_number TEXT;
  v_seq INTEGER;
  v_sales_initial TEXT;
  v_date_str TEXT := TO_CHAR(NOW(), 'YYYYMMDD');
BEGIN
  -- Get Request Details
  SELECT inquiry_id, sales_initial INTO v_inquiry_id, v_sales_initial
  FROM awb_requests 
  WHERE id = p_request_id;
  
  IF v_inquiry_id IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  -- Default initial
  IF v_sales_initial IS NULL OR LENGTH(v_sales_initial) = 0 THEN
      v_sales_initial := 'XX';
  END IF;

  -- Generate Sequence from DB Sequence (Thread Safe)
  v_seq := nextval('global_awb_seq');
  
  -- Format AWB: ATR-[DATE]-[SEQ]-[INITIAL]
  v_awb_number := 'ATR-' || v_date_str || '-' || LPAD(v_seq::TEXT, 3, '0') || '-' || v_sales_initial;

  -- Update Inquiry
  UPDATE inquiries
  SET awb_number = v_awb_number,
      status = 'Proposal',
      awb_request_id = NULL
  WHERE id = v_inquiry_id;

  -- Update Request
  UPDATE awb_requests
  SET status = 'approved',
      awb_number = v_awb_number,
      approved_at = NOW(),
      approved_by = p_approved_by
  WHERE id = p_request_id;
  
  RETURN v_awb_number;
END;
$$;
