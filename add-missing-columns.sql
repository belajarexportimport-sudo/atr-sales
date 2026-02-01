-- ADD MISSING COMMISSION COLUMNS
-- This script fixes the "column commission_amount does not exist" error

-- 1. Add Columns to Inquiries Table
ALTER TABLE public.inquiries 
ADD COLUMN IF NOT EXISTS commission_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_status TEXT DEFAULT 'Pending';

-- 2. Grant Permissions (just in case)
GRANT ALL ON public.inquiries TO postgres, service_role;
GRANT SELECT, UPDATE, INSERT ON public.inquiries TO authenticated;

-- 3. Re-Deploy the RPC Function (To be 100% sure it matches)
CREATE OR REPLACE FUNCTION public.approve_commission(
  p_inquiry_id UUID,
  p_commission_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the inquiry with the approved amount
  UPDATE public.inquiries
  SET 
    commission_amount = p_commission_amount,
    commission_status = 'Approved'
  WHERE id = p_inquiry_id;

  RETURN jsonb_build_object('success', true, 'message', 'Commission approved');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

SELECT 'Commission columns added and RPC updated' as status;
