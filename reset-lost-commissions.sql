-- EMERGENCY: Reset commission for Lost/Cancelled inquiries
-- Run this if the frontend fix doesn't seem to apply due to caching, 
-- or if you want to permanently clean the database values.

UPDATE inquiries
SET 
  commission_amount = 0,
  est_commission = 0,
  commission_status = 'Cancelled'
WHERE 
  status IN ('Lost', 'Cancelled');

-- Verify results
SELECT id, status, commission_amount, est_commission 
FROM inquiries 
WHERE status IN ('Lost', 'Cancelled');
