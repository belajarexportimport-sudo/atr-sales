-- CEK DATA REVENUE DI DATABASE
-- Jalankan query ini di Supabase SQL Editor untuk melihat data sebenarnya

SELECT 
    id,
    customer_name,
    status,
    quote_status,
    commission_status,
    est_revenue,
    est_gp,
    est_commission,
    created_at
FROM inquiries
WHERE customer_name ILIKE '%arso%' 
   OR customer_name ILIKE '%emov%'
ORDER BY created_at DESC
LIMIT 10;

-- Jika est_revenue = NULL atau 0, berarti data memang kosong di database
-- Jika est_revenue ada angkanya, berarti masalah di frontend (RLS atau fetch)
