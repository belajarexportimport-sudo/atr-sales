-- FIX AWB WORKFLOW & APPROVAL LOGIC
-- 1. Updates `request_awb` to ONLY create a pending request (no generation).
-- 2. Updates `approve_awb_request` to GENERATE the AWB using the new scalable format.

-- A. REVERT request_awb (Sales Action) -> Just Insert Request
CREATE OR REPLACE FUNCTION public.request_awb(p_inquiry_id UUID, p_sales_rep_id UUID, p_sales_initial TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id UUID;
  v_existing_request UUID;
BEGIN
  -- Check if already has AWB
  IF EXISTS (SELECT 1 FROM inquiries WHERE id = p_inquiry_id AND awb_number IS NOT NULL) THEN
     RETURN jsonb_build_object('success', false, 'message', 'Inquiry already has AWB');
  END IF;

  -- Check pending request
  SELECT id INTO v_existing_request FROM awb_requests WHERE inquiry_id = p_inquiry_id AND status = 'pending';
  
  IF v_existing_request IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'message', 'Request already pending', 'request_id', v_existing_request);
  END IF;
  
  -- Insert into awb_requests
  INSERT INTO awb_requests (inquiry_id, sales_rep_id, sales_initial, status)
  VALUES (p_inquiry_id, p_sales_rep_id, p_sales_initial, 'pending')
  RETURNING id INTO v_request_id;
  
  -- Update inquiry flag
  UPDATE inquiries SET awb_request_id = v_request_id WHERE id = p_inquiry_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'Request submitted', 'request_id', v_request_id);
END;
$$;


-- B. UPDATE approve_awb_request (Admin Action) -> GENERATE AWB
CREATE OR REPLACE FUNCTION public.approve_awb_request(p_request_id UUID, p_approved_by UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inquiry_id UUID;
  v_sales_rep_id UUID;
  v_sales_initial TEXT;
  v_sales_code TEXT;
  v_identifier TEXT;
  v_awb_number TEXT;
  v_seq INTEGER;
  v_year TEXT := TO_CHAR(NOW(), 'YYYY');
  v_month TEXT := TO_CHAR(NOW(), 'MM');
BEGIN
  -- Get Request Details
  SELECT inquiry_id, sales_rep_id, sales_initial 
  INTO v_inquiry_id, v_sales_rep_id, v_sales_initial
  FROM awb_requests 
  WHERE id = p_request_id;
  
  IF v_inquiry_id IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  -- 1. Determine Identifier (Sales Code > Initials)
  SELECT sales_code INTO v_sales_code FROM profiles WHERE id = v_sales_rep_id;
  
  IF v_sales_code IS NOT NULL AND LENGTH(v_sales_code) > 0 THEN
      v_identifier := v_sales_code;
  ELSE
      v_identifier := COALESCE(v_sales_initial, 'XX');
  END IF;

  -- 2. Generate Sequence (Count users AWBs this month + 1)
  -- Uses the inquiries table to count existing AWBs for the current month
  SELECT COUNT(*) + 1 INTO v_seq 
  FROM inquiries 
  WHERE to_char(created_at, 'YYYY-MM') = (v_year || '-' || v_month)
  AND awb_number IS NOT NULL;
  
  -- 3. Format AWB: ATR-YYYY-MM-ID-SEQ
  v_awb_number := 'ATR-' || v_year || '-' || v_month || '-' || v_identifier || '-' || LPAD(v_seq::TEXT, 3, '0');

  -- 4. Update Inquiry
  UPDATE inquiries
  SET awb_number = v_awb_number,
      status = 'Proposal', -- Auto-move to Proposal
      awb_request_id = NULL -- Clear flag
  WHERE id = v_inquiry_id;

  -- 5. Update Request
  UPDATE awb_requests
  SET status = 'approved',
      awb_number = v_awb_number,
      approved_at = NOW(),
      approved_by = p_approved_by
  WHERE id = p_request_id;
  
  RETURN v_awb_number;
END;
$$;
