-- SOLUTION: Update PT Amuka Revenue Manually
-- Karena field revenue tidak ada di create inquiry form,
-- admin harus update revenue setelah inquiry dibuat

-- Update PT Amuka dengan revenue yang benar
UPDATE inquiries
SET 
    est_revenue = 80000,      -- Ganti dengan nilai revenue yang benar
    est_gp = 60000,           -- Ganti dengan nilai GP yang benar
    est_commission = 1200,    -- Auto: GP * 2% = 60000 * 0.02
    updated_at = NOW()
WHERE customer_name ILIKE '%amuka%'
AND created_at >= CURRENT_DATE - INTERVAL '1 day';

-- Verify
SELECT 
    customer_name,
    est_revenue,
    est_gp,
    est_commission,
    status,
    created_at
FROM inquiries
WHERE customer_name ILIKE '%amuka%'
ORDER BY created_at DESC
LIMIT 1;

-- Expected result:
-- est_revenue: 80000
-- est_gp: 60000
-- est_commission: 1200

-- Setelah run query ini, refresh app (Ctrl + F5)
-- Revenue akan langsung muncul di dashboard!
