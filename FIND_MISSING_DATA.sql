-- FIND MISSING DATA (PT Agra Ali)

-- 1. Search for the specific customer regardless of status
SELECT 
    id, 
    customer_name, 
    quote_status, 
    user_id,
    created_at,
    origin_city,
    destination_city
FROM inquiries 
WHERE customer_name ILIKE '%Agra Ali%';

-- 2. Check the most recent 5 inquiries overall
SELECT 
    id, 
    customer_name, 
    quote_status, 
    user_id,
    created_at
FROM inquiries 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check if there are any RLS policy violations recorded (not easy in standard postgres, but we can check policies again)
-- Just listing policies to be sure nothing reverted
SELECT * FROM pg_policies WHERE tablename = 'inquiries';
