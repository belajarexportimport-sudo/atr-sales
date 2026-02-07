-- SOLUSI RADIKAL: Ganti kolom revenue dengan kolom baru
-- Ini akan bypass semua masalah tersembunyi di kolom lama

-- Step 1: Tambah kolom baru
ALTER TABLE inquiries 
ADD COLUMN revenue_new NUMERIC(15,2) DEFAULT 0,
ADD COLUMN gp_new NUMERIC(15,2) DEFAULT 0,
ADD COLUMN commission_new NUMERIC(15,2) DEFAULT 0;

-- Step 2: Copy data lama ke kolom baru
UPDATE inquiries 
SET 
    revenue_new = COALESCE(est_revenue, 0),
    gp_new = COALESCE(est_gp, 0),
    commission_new = COALESCE(est_commission, 0);

-- Step 3: Verify data copied
SELECT 
    customer_name,
    est_revenue AS old_revenue,
    revenue_new AS new_revenue,
    est_gp AS old_gp,
    gp_new AS new_gp
FROM inquiries
WHERE est_revenue IS NOT NULL OR revenue_new IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Step 4: Drop old columns (HATI-HATI - backup dulu!)
-- ALTER TABLE inquiries 
-- DROP COLUMN est_revenue,
-- DROP COLUMN est_gp,
-- DROP COLUMN est_commission;

-- Step 5: Rename new columns to old names
-- ALTER TABLE inquiries 
-- RENAME COLUMN revenue_new TO est_revenue;
-- ALTER TABLE inquiries 
-- RENAME COLUMN gp_new TO est_gp;
-- ALTER TABLE inquiries 
-- RENAME COLUMN commission_new TO est_commission;

-- ATAU: Pakai kolom baru langsung (revenue_new, gp_new, commission_new)
-- Lalu update frontend untuk pakai kolom baru
