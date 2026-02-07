-- CEK & BUAT RPC admin_update_financials
-- RPC ini dibutuhkan untuk admin update Revenue/GP

-- 1. Cek apakah RPC ada
SELECT proname, pg_get_function_arguments(oid) 
FROM pg_proc 
WHERE proname = 'admin_update_financials';

-- Jika tidak ada hasil, jalankan script di bawah:

-- 2. Buat RPC admin_update_financials
CREATE OR REPLACE FUNCTION admin_update_financials(
    p_inquiry_id UUID,
    p_revenue NUMERIC,
    p_gp NUMERIC,
    p_commission NUMERIC
)
RETURNS VOID AS $$
BEGIN
    UPDATE inquiries
    SET 
        est_revenue = p_revenue,
        est_gp = p_gp,
        est_commission = p_commission
    WHERE id = p_inquiry_id;
    
    RAISE NOTICE 'Admin updated financials: ID=%, Revenue=%, GP=%, Commission=%', 
        p_inquiry_id, p_revenue, p_gp, p_commission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Test RPC
SELECT admin_update_financials(
    (SELECT id FROM inquiries WHERE customer_name ILIKE '%asih%' LIMIT 1),
    6000000,
    5000000,
    100000
);

-- 4. Verify
SELECT customer_name, est_revenue, est_gp, est_commission
FROM inquiries
WHERE customer_name ILIKE '%asih%';
