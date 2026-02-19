-- DIAGNOSA RPC (KENAPA TOMBOL DI APP GAGAL?)
-- Kita cek apakah fungsi 'grab_lead' benar-benar jalan kalau dipanggil manual.

-- 1. Cek ID Lead Testing tadi
SELECT id, customer_name, status, user_id 
FROM inquiries 
WHERE customer_name = 'TESTING SYSTEM SHARK TANK (COBA GRAB SAYA)';

-- 2. Cek Definisi Fungsi (Apakah ada duplikat?)
SELECT proname, prosrc, proargnames 
FROM pg_proc 
WHERE proname = 'grab_lead';

-- 3. SIMULASI PANGGIL RPC (Persis seperti yang dilakukan App)
-- Ganti 'ID_LEAD_DARI_HASIL_NO_1' dengan ID yang muncul nanti.
-- Kita pakai blok DO untuk menangkap error.
DO $$
DECLARE
    v_lead_id UUID;
    v_grabber_id UUID := 'd2f0266d-94e4-4ee0-9251-d6cbe0cc34b6'; -- ID Arif
    v_success BOOLEAN;
BEGIN
    -- Ambil ID Lead Testing secara otomatis
    SELECT id INTO v_lead_id 
    FROM inquiries 
    WHERE customer_name = 'TESTING SYSTEM SHARK TANK (COBA GRAB SAYA)' 
    LIMIT 1;

    IF v_lead_id IS NULL THEN
        RAISE NOTICE '❌ Lead Testing tidak ditemukan! Buat dulu.';
        RETURN;
    END IF;

    RAISE NOTICE '🧪 Mencoba grab lead ID: %', v_lead_id;

    -- PANGGIL RPC
    v_success := grab_lead(p_lead_id := v_lead_id, p_grabber_id := v_grabber_id);

    IF v_success THEN
        RAISE NOTICE '✅ RPC Berhasil! Lead terambil.';
    ELSE
        RAISE NOTICE '❌ RPC Mengembalikan FALSE (Gagal). Mungkin statusnya sudah berubah?';
    END IF;
END $$;

-- 4. Cek Hasil Akhir
SELECT id, user_id, status 
FROM inquiries 
WHERE customer_name = 'TESTING SYSTEM SHARK TANK (COBA GRAB SAYA)';
