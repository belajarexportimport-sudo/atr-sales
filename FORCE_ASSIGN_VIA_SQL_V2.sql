-- FORCE ASSIGN LEAD VIA SQL (V2)
-- Script ini otomatis mencari lead kosong (random) dan memberikannya ke Sales.
-- Tidak perlu repot cari ID Lead manual.

-- CUKUP GANTI 1 HAL SAJA DI BAWAH INI:
-- Ganti 'EMAIL_SALES_ANDA@GMAIL.COM' dengan email Sales yang valid.

DO $$
DECLARE
    v_sales_email TEXT := 'EMAIL_SALES_ANDA@GMAIL.COM'; -- << GANTI INI DENGAN EMAIL SALES
    
    -- JANGAN UBAH DI BAWAH INI --
    v_sales_id UUID;
    v_lead_target UUID;
BEGIN
    -- 1. Cari ID Sales dari Email
    SELECT id INTO v_sales_id FROM auth.users WHERE email = v_sales_email;
    
    IF v_sales_id IS NULL THEN
        RAISE NOTICE '❌ ERROR: Email Sales tidak ditemukan! Cek typo.';
        RETURN;
    END IF;

    -- 2. Cari Lead Random yang STATUSNYA 'UNASSIGNED' atau USER_ID NULL
    SELECT id INTO v_lead_target FROM inquiries 
    WHERE user_id IS NULL 
    LIMIT 1;

    IF v_lead_target IS NULL THEN
        RAISE NOTICE '❌ SHARK TANK KOSONG! Tidak ada lead yang bisa diambil.';
        RETURN;
    END IF;

    -- 3. Eksekusi Grab Paksa
    UPDATE inquiries
    SET 
        user_id = v_sales_id,
        status = 'Profiling',
        updated_at = NOW()
    WHERE id = v_lead_target;

    IF FOUND THEN
        RAISE NOTICE '✅ SUKSES BESAR! Lead ID % berhasil diberikan ke % (ID: %)', v_lead_target, v_sales_email, v_sales_id;
        RAISE NOTICE '👉 Cek Dashboard Sales sekarang, harusnya sudah muncul!';
    ELSE
        RAISE NOTICE '❌ GAGAL! Ada masalah aneh saat update.';
    END IF;
END $$;
