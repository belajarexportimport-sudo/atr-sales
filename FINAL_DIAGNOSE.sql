-- DIAGNOSE FINAL: Lihat data mentah dan coba update dengan berbagai cara

-- Step 1: Lihat data mentah PT Gema (termasuk kolom tersembunyi)
SELECT *
FROM inquiries
WHERE customer_name ILIKE '%gema%';

-- Step 2: Coba update dengan WHERE id langsung (bukan ILIKE)
-- Ganti 'YOUR_INQUIRY_ID' dengan ID sebenarnya dari Step 1
UPDATE inquiries
SET 
    est_revenue = 6000000,
    est_gp = 5000000
WHERE id = 'YOUR_INQUIRY_ID_HERE'
RETURNING *;

-- Step 3: Coba update HANYA revenue (tanpa GP)
UPDATE inquiries
SET est_revenue = 6000000
WHERE customer_name ILIKE '%gema%'
RETURNING id, customer_name, est_revenue;

-- Step 4: Coba update dengan NULL dulu, baru isi
UPDATE inquiries
SET est_revenue = NULL
WHERE customer_name ILIKE '%gema%';

UPDATE inquiries
SET est_revenue = 6000000
WHERE customer_name ILIKE '%gema%'
RETURNING id, customer_name, est_revenue;

-- Step 5: Check apakah ada RULE di table
SELECT 
    rulename,
    ev_type,
    is_instead,
    ev_enabled
FROM pg_rules
WHERE tablename = 'inquiries';
