-- AUTO FIX: AMBIL LEAD SEMBARANG (YANG PENTING ADA)
-- Script ini tidak perlu ID Lead. Dia akan cari sendiri lead kosong.
-- ID User Sales (Arif): d2f0266d-94e4-4ee0-9251-d6cbe0cc34b6

DO $$
DECLARE
    v_sales_id UUID := 'd2f0266d-94e4-4ee0-9251-d6cbe0cc34b6';
    v_target_lead_id UUID;
BEGIN
    -- 1. Cari SATU lead yang masih kosong (Milik Siapa Saja)
    SELECT id INTO v_target_lead_id
    FROM inquiries 
    WHERE user_id IS NULL
    LIMIT 1;

    -- 2. Jika Tidak Ada Lead Kosong
    IF v_target_lead_id IS NULL THEN
        RAISE NOTICE '❌ SHARK TANK KOSONG! Tidak ada lead yang bisa diambil.';
        RETURN;
    END IF;

    -- 3. Paksa Update (Tanpa Peduli RLS/Permissions)
    UPDATE inquiries
    SET 
        user_id = v_sales_id,
        status = 'Profiling',
        updated_at = NOW()
    WHERE id = v_target_lead_id;

    RAISE NOTICE '✅ SUKSES! Lead ID % berhasil diambil paksa untuk Arif.', v_target_lead_id;
END $$;

-- Cek Hasilnya
SELECT id, user_id, status, customer_name 
FROM inquiries 
WHERE user_id = 'd2f0266d-94e4-4ee0-9251-d6cbe0cc34b6'
ORDER BY updated_at DESC
LIMIT 5;
