-- COMMISSION PAYMENT SYSTEM
-- 1. Create function to Mark Commission as PAID
CREATE OR REPLACE FUNCTION mark_commission_paid(
  p_inquiry_id UUID,
  p_paid_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE inquiries
  SET 
      commission_status = 'Paid',
      -- You might want a new column for this, but reusing existing columns is safer for now unless requested
      -- Let's just update the status text.
      updated_at = NOW()
  WHERE id = p_inquiry_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant permissions
GRANT EXECUTE ON FUNCTION mark_commission_paid(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_commission_paid(UUID, UUID) TO service_role;
