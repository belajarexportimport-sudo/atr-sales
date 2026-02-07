-- FORCE RECREATE approve_quote (Hapus SEMUA versi lama)
-- Jalankan di Supabase SQL Editor

-- 1. Hapus SEMUA versi approve_quote (termasuk yang overloaded)
DROP FUNCTION IF EXISTS approve_quote(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS approve_quote(uuid, uuid, numeric, numeric) CASCADE;
DROP FUNCTION IF EXISTS approve_quote CASCADE;

-- 2. Buat ulang dengan signature yang BENAR
CREATE OR REPLACE FUNCTION approve_quote(
    p_inquiry_id UUID, 
    p_approved_by UUID,
    p_revenue NUMERIC, 
    p_gp NUMERIC
)
RETURNS VOID AS $$
BEGIN
    -- Update inquiry dengan Revenue & GP
    UPDATE inquiries
    SET 
        quote_status = 'Approved',
        est_revenue = p_revenue,
        est_gp = p_gp,
        est_commission = p_gp * 0.02, -- 2% dari GP
        status = 'Proposal',
        commission_status = 'Pending'
    WHERE id = p_inquiry_id;
    
    -- Log untuk debugging
    RAISE NOTICE 'Quote Approved: ID=%, Revenue=%, GP=%, Commission=%', 
        p_inquiry_id, p_revenue, p_gp, (p_gp * 0.02);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Test langsung
SELECT approve_quote(
    '67cad004-4bcc-4fde-9793-98529ecc32d9'::uuid,
    (SELECT id FROM profiles WHERE email = 'aditatrexpress@gmail.com' LIMIT 1),
    6000000,
    5000000
);

-- 4. Cek hasilnya
SELECT 
    customer_name,
    est_revenue,
    est_gp,
    est_commission,
    status,
    quote_status
FROM inquiries
WHERE id = '67cad004-4bcc-4fde-9793-98529ecc32d9';

-- Harusnya est_revenue = 6000000, est_gp = 5000000, est_commission = 100000
