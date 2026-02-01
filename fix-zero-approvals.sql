-- FIX ZERO APPROVALS
-- This script finds inquiries that are marked 'Approved' but have 0 commission.
-- It resets them to 'Pending' so the formula can re-calculate the correct amount based on GP.

UPDATE public.inquiries
SET 
  commission_status = 'Pending',
  commission_approved = false
WHERE 
  (commission_status = 'Approved' OR commission_approved = true)
  AND (commission_amount = 0 OR commission_amount IS NULL);

SELECT 'Fixed ' || count(*) || ' zero-commission approvals.' as result FROM public.inquiries 
WHERE commission_status = 'Pending' AND commission_amount = 0; -- Just a query to show impact (approximation)
