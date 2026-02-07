-- CEK & FIX QUOTE STATUS
-- Inquiry harus punya quote_status = 'Pending' untuk muncul di Ops

-- 1. Cek status PT Asih
SELECT 
    id,
    customer_name,
    status,
    quote_status,
    est_revenue,
    est_gp
FROM inquiries
WHERE customer_name ILIKE '%asih%'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Jika quote_status bukan 'Pending', set ke Pending
UPDATE inquiries
SET quote_status = 'Pending'
WHERE customer_name ILIKE '%asih%'
  AND quote_status != 'Approved';

-- 3. Cek lagi
SELECT 
    id,
    customer_name,
    status,
    quote_status
FROM inquiries
WHERE quote_status = 'Pending'
ORDER BY created_at DESC;
