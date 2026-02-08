-- VERIFY PT Angkasa Data

-- Step 1: Check who is user_id 3c0b0927-98e3-4741-9bea-2d74b26bb30e
SELECT 
    id,
    email,
    raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE id = '3c0b0927-98e3-4741-9bea-2d74b26bb30e';

-- Step 2: Check PT Angkasa inquiry details
SELECT 
    id,
    customer_name,
    user_id,
    est_revenue,
    est_gp,
    est_commission,
    awb_number,
    created_at,
    updated_at
FROM inquiries
WHERE customer_name ILIKE '%Angkasa%'
ORDER BY created_at DESC
LIMIT 1;

-- Step 3: Check admin user ID
SELECT 
    id,
    email,
    raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE email = 'aditatrexpress@gmail.com';

-- ANALYSIS:
-- If user_id in Step 2 = admin ID from Step 3 → Bug masih ada
-- If user_id in Step 2 = sales ID (different from admin) → Bug fixed!
