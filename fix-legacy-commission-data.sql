-- FIX LEGACY DATA (BACKFILL COMMISSION)
-- This script copies the old 'est_commission' to the new 'commission_amount'
-- so that you don't have to manually approve every single record again.

-- 1. Update records where commission_amount is missing but est_commission exists
UPDATE public.inquiries
SET 
  commission_amount = est_commission,
  commission_status = 'Approved' -- We assume existing estimates were correct
WHERE 
  (commission_amount IS NULL OR commission_amount = 0)
  AND est_commission > 0;

SELECT 'Legacy commission data has been migrated.' as status;
