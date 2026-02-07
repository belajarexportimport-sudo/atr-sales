-- CHECK: Apakah PT Amuka revenue tersimpan di database?
-- Run query ini di Supabase SQL Editor

SELECT 
    customer_name,
    est_revenue,
    est_gp,
    est_commission,
    status,
    created_at
FROM inquiries
WHERE customer_name ILIKE '%amuka%'
ORDER BY created_at DESC;

-- Expected result:
-- customer_name: PT Amuka
-- est_revenue: 80000 (atau nilai yang Anda input)
-- est_gp: (nilai GP)
-- est_commission: (nilai commission)

-- Jika est_revenue NULL atau 0, berarti data tidak tersimpan!
