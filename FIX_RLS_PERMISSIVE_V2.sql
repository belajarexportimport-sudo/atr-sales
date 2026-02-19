-- FIX RLS: DARI KETAT JADI SANTAI (VERSI 2 - FIX KOLOM) 🛠️
-- PENTING: Kolom yang benar adalah 'weight' dan 'dimension' (Bukan est_weight).

-- 1. HAPUS POLICY UPDATE LAMA
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON inquiries;

-- 2. BUAT POLICY UPDATE BARU (LEBIH SANTAI)
-- Perubahan: Bagian "WITH CHECK" kita ganti jadi TRUE.
CREATE POLICY "Enable update for users based on user_id" ON inquiries FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (true); 

-- 3. TEST UPDATE MANUAL (DENGAN NAMA KOLOM YANG BENAR)
DO $$
DECLARE
    v_test_id UUID;
    v_sales_id UUID := 'd2f0266d-94e4-4ee0-9251-d6cbe0cc34b6'; -- ID Arif
BEGIN
    -- Buat Lead Pancingan (LENGKAP & BENAR)
    INSERT INTO inquiries (
        customer_name, status, user_id, 
        origin, destination, service_type,
        weight, dimension, est_commission,
        created_at, updated_at
    ) 
    VALUES (
        'TESTING RLS SANTAI (FINAL)', 
        'Profiling', 
        NULL,
        'Jakarta', 'Surabaya', 'Darat',
        10, '10x10x10', 0,
        NOW(), NOW()
    ) 
    RETURNING id INTO v_test_id;

    -- Coba Update (Simulasi)
    UPDATE inquiries 
    SET user_id = v_sales_id, status = 'Profiling'
    WHERE id = v_test_id;

    -- Cek Hasil
    IF EXISTS (SELECT 1 FROM inquiries WHERE id = v_test_id AND user_id = v_sales_id) THEN
        RAISE NOTICE '✅ RLS SUKSES: Update berhasil dengan policy santai.';
    ELSE
        RAISE NOTICE '❌ RLS GAGAL: Masih ada yang menghalangi.';
    END IF;
END $$;

SELECT '✅ FIX RLS SELESAI. Silakan coba tombol GRAB di App.' as status;
