-- CHECK: Apakah revenue tersimpan di database?
-- Run query ini untuk lihat inquiry terakhir yang Anda buat

SELECT 
    id,
    customer_name,
    est_revenue,
    est_gp,
    est_commission,
    created_at,
    user_id
FROM inquiries
ORDER BY created_at DESC
LIMIT 5;

-- Kalau est_revenue = 0 atau NULL, berarti memang tidak tersimpan
-- Kalau est_revenue ada angkanya, berarti tersimpan tapi tidak tampil di frontend
