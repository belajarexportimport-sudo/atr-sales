-- TEST UPDATE dengan exact ID inquiry Alam Sejahtera

-- Step 1: Lihat data sekarang
SELECT id, customer_name, est_revenue, est_gp, est_commission
FROM inquiries
WHERE id = 'aa058047-f85c-44d2-bac1-93e908b477ce';

-- Step 2: Update dengan exact ID
UPDATE inquiries
SET 
    est_revenue = 8000000,
    est_gp = 7000000,
    est_commission = 140000
WHERE id = 'aa058047-f85c-44d2-bac1-93e908b477ce'
RETURNING id, customer_name, est_revenue, est_gp, est_commission;

-- Step 3: Verify hasil
SELECT id, customer_name, est_revenue, est_gp, est_commission
FROM inquiries
WHERE id = 'aa058047-f85c-44d2-bac1-93e908b477ce';
