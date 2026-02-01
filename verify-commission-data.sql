-- VERIFY COMMISSION DATA & RPC
-- 1. Check if 'approve_commission' actually updates the amount
-- 2. Check if a random Inquiry has the commission value

-- A. Create a Dummy Inquiry (if needed, but better to check existing)
-- Let's just check the last 5 Inquiries to see their status

SELECT 
  id, 
  created_at, 
  user_id, 
  status, 
  commission_amount, 
  commission_status 
FROM public.inquiries 
ORDER BY created_at DESC 
LIMIT 5;

-- B. Test the RPC manually (simulate Admin action)
-- Replace 'INQUIRY_ID' with a real ID from the list above to test
-- SELECT * FROM public.approve_commission('INQUIRY_ID', 150000);

-- C. Check RLS Policy (Simulated)
-- We can't easily simulate "As User" here without complex set_config
-- But we can check if the column exists and has data.
