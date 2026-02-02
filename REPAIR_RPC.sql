-- Drop the specific function signature to avoid ambiguity
DROP FUNCTION IF EXISTS approve_commission(UUID, UUID, NUMERIC);

-- Also drop any legacy signatures if they exist (just in case)
DROP FUNCTION IF EXISTS approve_commission(UUID, UUID, FLOAT);
DROP FUNCTION IF EXISTS approve_commission(UUID, UUID, INTEGER);

-- Re-create the robust function
CREATE OR REPLACE FUNCTION approve_commission(
  p_inquiry_id UUID,
  p_approved_by UUID,
  p_commission_amount NUMERIC
)
RETURNS VOID AS $$
BEGIN
  UPDATE inquiries
  SET 
    commission_status = 'Approved',
    commission_approved_by = p_approved_by,
    commission_amount = p_commission_amount,
    est_commission = p_commission_amount,
    updated_at = NOW()
  WHERE id = p_inquiry_id;
END;
$$ LANGUAGE plpgsql;
