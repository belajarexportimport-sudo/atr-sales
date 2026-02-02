-- FIX COMMISSION APPROVAL FUNCTION
-- Ensures that the approved amount is saved to the 'commission_amount' (Verified) column
-- Preventing it from being lost or 0.

CREATE OR REPLACE FUNCTION approve_commission(
  p_inquiry_id UUID,
  p_approved_by UUID,
  p_commission_amount DECIMAL DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.inquiries
  SET 
      commission_approved = TRUE,
      commission_approved_at = NOW(),
      commission_approved_by = p_approved_by,
      -- IMPORTANT: Save to BOTH columns to ensure consistency
      commission_amount = COALESCE(p_commission_amount, est_commission, 0),
      est_commission = COALESCE(p_commission_amount, est_commission, 0)
  WHERE id = p_inquiry_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION approve_commission(UUID, UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_commission(UUID, UUID, DECIMAL) TO service_role;
