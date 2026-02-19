-- SAPU JAGAT: AMBIL SEMUA SISA SHARK TANK 🧹🦈
-- Script ini akan mengambil SEMUA lead yang status user_id-nya masih KOSONG (NULL).
-- Semuanya akan dipindahkan ke akun Arif (d2f0266d...).

DO $$
DECLARE
    v_sales_id UUID := 'd2f0266d-94e4-4ee0-9251-d6cbe0cc34b6'; -- ID Arif
    v_count INTEGER;
BEGIN
    -- 1. Hitung dulu berapa korbannya
    SELECT count(*) INTO v_count FROM inquiries WHERE user_id IS NULL;

    IF v_count = 0 THEN
        RAISE NOTICE '✅ Shark Tank sudah bersih! Tidak ada lead sisa.';
        RETURN;
    END IF;

    -- 2. Update Massal (Sapu Bersih)
    UPDATE inquiries
    SET 
        user_id = v_sales_id,
        status = 'Profiling',
        updated_at = NOW()
    WHERE user_id IS NULL;

    RAISE NOTICE '✅ SUKSES! % Lead berhasil dipindahkan ke akun Arif.', v_count;
END $$;

-- Cek Hasil Akhir (List Lead Milik Arif - Terbaru)
SELECT id, customer_name, status, updated_at 
FROM inquiries 
WHERE user_id = 'd2f0266d-94e4-4ee0-9251-d6cbe0cc34b6'
ORDER BY updated_at DESC
LIMIT 10;
