-- CHECK RAW DATA
-- Lihat apakah data aslinya memang 0 atau ada angkanya
SELECT 
    id, 
    customer_name, 
    status, 
    quote_status, 
    est_revenue, 
    est_gp, 
    est_commission
FROM inquiries 
ORDER BY created_at DESC 
LIMIT 5;
