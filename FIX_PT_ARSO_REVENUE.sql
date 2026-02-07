-- UPDATE REVENUE PT ARSO
-- Jalankan di Supabase SQL Editor

UPDATE inquiries
SET 
    est_revenue = 5000000,  -- Ganti dengan nilai yang benar
    est_gp = 4000000,       -- Ganti dengan nilai yang benar
    est_commission = 80000  -- 2% dari GP
WHERE customer_name ILIKE '%arso%'
  AND est_revenue IS NULL;

-- Cek hasilnya
SELECT 
    customer_name,
    est_revenue,
    est_gp,
    est_commission,
    status,
    quote_status
FROM inquiries
WHERE customer_name ILIKE '%arso%';
