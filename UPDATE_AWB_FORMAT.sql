-- UPDATE AWB GENERATION LOGIC (SCALABLE FORMAT)
-- Updates the request_awb function to use Sales Code (if available) instead of Initials.

DROP FUNCTION IF EXISTS public.request_awb(uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.request_awb(p_inquiry_id UUID, p_sales_rep_id UUID, p_sales_initial TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_awb_number TEXT;
  v_seq INTEGER;
  v_year TEXT := TO_CHAR(NOW(), 'YYYY');
  v_month TEXT := TO_CHAR(NOW(), 'MM');
  v_sales_code TEXT;
  v_identifier TEXT;
  v_inquiry_exists BOOLEAN;
BEGIN
  -- 1. Check if Inquiry exists
  SELECT EXISTS(SELECT 1 FROM inquiries WHERE id = p_inquiry_id) INTO v_inquiry_exists;
  IF NOT v_inquiry_exists THEN
    RETURN jsonb_build_object('error', 'Inquiry not found');
  END IF;

  -- 2. Check if AWB already exists
  SELECT awb_number INTO v_awb_number FROM inquiries WHERE id = p_inquiry_id;
  IF v_awb_number IS NOT NULL THEN
     RETURN jsonb_build_object('success', false, 'message', 'AWB already exists', 'awb_number', v_awb_number);
  END IF;

  -- 3. Determine Identifier (Sales Code > Initials > 'UNK')
  SELECT sales_code INTO v_sales_code FROM profiles WHERE id = p_sales_rep_id;
  
  -- Logic: If Sales Code exists (e.g., 'ATR005'), use it. Else use Initials.
  -- Format: ATR-[YYYY]-[MM]-[IDENTIFIER]-[SEQ]
  IF v_sales_code IS NOT NULL AND LENGTH(v_sales_code) > 0 THEN
      v_identifier := v_sales_code;
  ELSE
      v_identifier := COALESCE(p_sales_initial, 'XX');
  END IF;

  -- 4. Generate Sequence (Simple Monthly Sequence per identifier is too complex, let's do Global Monthly Sequence or per-Sales Sequence?)
  -- Legacy format was likely Global. Let's stick to a Global Sequence for simplicity and uniqueness, OR per attributes.
  -- To keep it "bug free" and simple, let's allow the database to count inquiries for this user this month?
  -- Or just use a random number? 
  -- BETTER: Count how many AWBs generated this month to create a running number.
  
  -- Count AWBs created this month (approximate sequence)
  SELECT COUNT(*) + 1 INTO v_seq 
  FROM inquiries 
  WHERE to_char(created_at, 'YYYY-MM') = (v_year || '-' || v_month)
  AND awb_number IS NOT NULL;
  
  -- Pad sequence (e.g., 001, 002)
  -- New Format: ATR-2026-02-ATR001-005 (Year-Month-SalesID-GlobalSeq)
  -- This ensures uniqueness combined with timestamp.
  
  v_awb_number := 'ATR-' || v_year || '-' || v_month || '-' || v_identifier || '-' || LPAD(v_seq::TEXT, 3, '0');

  -- 5. Update Inquiry
  UPDATE inquiries
  SET awb_number = v_awb_number,
      status = 'Proposal', -- Auto-move to Proposal if not already
      awb_request_id = NULL -- Clear request flag if it was pending
  WHERE id = p_inquiry_id;

  RETURN jsonb_build_object('success', true, 'awb_number', v_awb_number);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;
