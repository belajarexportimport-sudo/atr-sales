-- FIX AMBIGUOUS FUNCTION ERROR
-- This script removes ALL versions of approve_commission to fix the conflict
-- Run this in Supabase SQL Editor

-- 1. Drop both potential existing signatures to clear the conflict
DROP FUNCTION IF EXISTS public.approve_commission(UUID, UUID);
DROP FUNCTION IF EXISTS public.approve_commission(UUID, UUID, DECIMAL);
DROP FUNCTION IF EXISTS public.approve_commission(UUID, UUID, NUMERIC);

-- 2. Re-create the single, correct function
CREATE OR REPLACE FUNCTION public.approve_commission(
  p_inquiry_id UUID,
  p_approved_by UUID,
  p_commission_amount DECIMAL DEFAULT NULL -- Optional, defaults to NULL if not passed
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE inquiries
  SET commission_approved = TRUE,
      commission_approved_at = NOW(),
      commission_approved_by = p_approved_by,
      -- Update amount ONLY if a new amount is provided (not null)
      -- If p_commission_amount is NULL, keep the existing est_commission
      est_commission = COALESCE(p_commission_amount, est_commission)
  WHERE id = p_inquiry_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.approve_commission(UUID, UUID, DECIMAL) TO authenticated;

SELECT 'Function fixed successfully. Ambiguity removed.' as status;
