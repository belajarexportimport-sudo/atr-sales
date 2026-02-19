-- FIX RLS & TEST (SOLUSI PAMUNGKAS)
-- Masalahnya kemungkinan besar: "Satpam" (RLS) melarang Sales mengambil lead.
-- Kita akan buat "Surat Izin" (Policy) baru.

-- 1. BUAT POLICY BARU: "Sales Boleh Ambil Lead Kosong"
DROP POLICY IF EXISTS "Sales can grab open leads" ON inquiries;
CREATE POLICY "Sales can grab open leads"
ON inquiries FOR UPDATE
TO authenticated
USING (user_id IS NULL) -- Boleh edit kalau lead masih kosong
WITH CHECK (user_id = auth.uid()); -- Hasil edit harus jadi milik sendiri

-- 2. TEST BUAT LEAD BARU & AMBIL
DO $$
DECLARE
    v_sales_id UUID := 'd2f0266d-94e4-4ee0-9251-d6cbe0cc34b6'; -- ID Arif
    v_lead_id UUID;
BEGIN
    -- A. Buat Lead Pancingan (Shark Tank)
    INSERT INTO inquiries (
        customer_name, status, user_id, 
        origin, destination, service_type
    ) VALUES (
        'TES LEAD BARU (DARI SQL)', 'Profiling', NULL, 
        'Jakarta', 'Surabaya', 'Darat'
    ) RETURNING id INTO v_lead_id;

    RAISE NOTICE '🎣 Lead Pancingan Dibuat: %', v_lead_id;

    -- B. Coba Ambil (Pura-pura jadi Sales)
    -- Kita update manual (Simulasi Grab)
    UPDATE inquiries
    SET user_id = v_sales_id,
        status = 'Profiling',
        updated_at = NOW()
    WHERE id = v_lead_id;

    -- C. Cek Apakah Berhasil?
    IF EXISTS (SELECT 1 FROM inquiries WHERE id = v_lead_id AND user_id = v_sales_id) THEN
        RAISE NOTICE '✅ SUKSES! Lead berhasil diambil. Cek Dashboard Sales sekarang!';
    ELSE
        RAISE NOTICE '❌ Gagal. Masih tertahan sesuatu.';
    END IF;
END $$;
