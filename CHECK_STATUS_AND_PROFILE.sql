-- CHECK STATUS AND PROFILE for PT Agra Ali

-- 1. Check the STATUS of this specific inquiry
SELECT 
    id, 
    customer_name, 
    quote_status, 
    user_id
FROM inquiries 
WHERE id = '56899564-8fde-4d70-818d-635a7c105563';

-- 2. Check if the USER PROFILE exists
SELECT * 
FROM profiles 
WHERE id = '67cad004-4bcc-4fde-9793-98529ecc32d9';

-- 3. Force update to Pending (just in case it failed silently)
UPDATE inquiries
SET quote_status = 'Pending'
WHERE id = '56899564-8fde-4d70-818d-635a7c105563';

-- 4. Verify again after update
SELECT id, customer_name, quote_status 
FROM inquiries 
WHERE id = '56899564-8fde-4d70-818d-635a7c105563';
