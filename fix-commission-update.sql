-- Fix Commission Approval Logic
-- Handles saving the edited commission amount during approval

CREATE OR REPLACE FUNCTION approve_commission(
  p_inquiry_id UUID,
  p_approved_by UUID,
  p_commission_amount DECIMAL DEFAULT NULL -- Add optional parameter
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE inquiries
  SET commission_approved = TRUE,
      commission_approved_at = NOW(),
      commission_approved_by = p_approved_by,
      -- Update amount if provided (Admin edited it), otherwise keep existing
      est_commission = COALESCE(p_commission_amount, est_commission)
  WHERE id = p_inquiry_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission just in case
GRANT EXECUTE ON FUNCTION approve_commission(UUID, UUID, DECIMAL) TO authenticated;
