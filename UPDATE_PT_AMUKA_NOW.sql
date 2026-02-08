-- SOLUSI LANGSUNG: Update PT Amuka Revenue
-- Run query ini di Supabase SQL Editor

UPDATE inquiries
SET 
    est_revenue = 80000,
    est_gp = 60000,
    est_commission = 1200,
    updated_at = NOW()
WHERE customer_name ILIKE '%amuka%'
AND created_at >= CURRENT_DATE - INTERVAL '30 days'
RETURNING id, customer_name, est_revenue, est_gp, est_commission;

-- Setelah run query ini:
-- 1. Refresh app (Ctrl + F5)
-- 2. Revenue PT Amuka akan LANGSUNG MUNCUL di dashboard
-- 3. SELESAI!
