-- ============================================
-- SOLUSI FINAL: Manual Update PT Amuka Revenue
-- ============================================
-- Karena create inquiry dengan revenue tidak berhasil,
-- kita akan UPDATE revenue secara manual untuk PT Amuka

-- Step 1: Update PT Amuka dengan revenue yang benar
UPDATE inquiries
SET 
    est_revenue = 80000,
    est_gp = 60000,
    est_commission = 1200,
    updated_at = NOW()
WHERE customer_name ILIKE '%amuka%'
AND created_at >= CURRENT_DATE - INTERVAL '7 days'
RETURNING id, customer_name, est_revenue, est_gp, est_commission;

-- Step 2: Verify update berhasil
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

-- EXPECTED RESULT:
-- est_revenue: 80000
-- est_gp: 60000
-- est_commission: 1200

-- Setelah run query ini:
-- 1. Refresh app (Ctrl + F5)
-- 2. Revenue PT Amuka akan langsung muncul di dashboard
-- 3. SELESAI!

-- ============================================
-- UNTUK INQUIRY BARU KE DEPANNYA:
-- ============================================
-- Gunakan cara yang sama: Create dulu, lalu UPDATE revenue manual
-- Atau tunggu saya fix frontend/RLS policy dengan benar
