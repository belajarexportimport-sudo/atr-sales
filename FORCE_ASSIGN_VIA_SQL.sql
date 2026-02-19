-- FORCE ASSIGN LEAD VIA SQL (Debugging)
-- Gunakan script ini untuk MEMAKSA sistem memberikan Lead ke Sales tertentu.
-- Ini akan membuktikan apakah Database yang rusak atau Aplikasi yang salah kirim data.

-- Ganti 2 Data di Bawah Ini:
-- 1. 'EMAIL_SALES_ANDA@GMAIL.COM' -> Ganti dengan Email Sales yang mau ambil lead.
-- 2. 'UUID_LEAD_DARI_INSPECT' -> Ganti dengan ID Lead dari Inspect Element (atau biarkan query mencari lead random).

DO $$
DECLARE
    v_sales_email TEXT := 'EMAIL_SALES_ANDA@GMAIL.COM'; -- GANTI INI!
    v_lead_id UUID := 'UUID_LEAD_DARI_INSPECT'; -- GANTI INI kalau tau ID-nya!
    
    v_sales_id UUID;
    v_lead_target UUID;
BEGIN
    -- 1. Cari ID Sales dari Email
    SELECT id INTO v_sales_id FROM auth.users WHERE email = v_sales_email;
    IF v_sales_id IS NULL THEN
        RAISE NOTICE '❌ ERROR: Email Sales tidak ditemukan!';
        RETURN;
    END IF;

    -- 2. Cari Lead Target (Kalau ID di atas belum diisi/salah, cari lead random yg masih kosong)
    IF v_lead_id IS NULL OR v_lead_id::text = 'UUID_LEAD_DARI_INSPECT' THEN
        SELECT id INTO v_lead_target FROM inquiries WHERE user_id IS NULL LIMIT 1;
        IF v_lead_target IS NULL THEN
            RAISE NOTICE '❌ ERROR: Tidak ada Lead kosong di Shark Tank!';
            RETURN;
        END IF;
    ELSE
        v_lead_target := v_lead_id;
    END IF;

    -- 3. Eksekusi Grab Paksa
    UPDATE inquiries
    SET 
        user_id = v_sales_id,
        status = 'Profiling',
        updated_at = NOW()
    WHERE id = v_lead_target;

    IF FOUND THEN
        RAISE NOTICE '✅ SUKSES! Lead % berhasil dipindah ke % (ID: %)', v_lead_target, v_sales_email, v_sales_id;
    ELSE
        RAISE NOTICE '❌ GAGAL! Lead ID % tidak ditemukan atau error.', v_lead_target;
    END IF;
END $$;
