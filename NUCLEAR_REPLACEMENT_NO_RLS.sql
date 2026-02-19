-- NUCLEAR REPLACEMENT V2 (NO RLS)
-- Versi ini LEBIH AGRESIF:
-- 1. Matikan RLS dulu (supaya script pasti bisa MELIHAT lead lama).
-- 2. Lakukan Clone & Kill.
-- 3. Nyalakan RLS lagi.

-- MATIKAN RLS (PENTING!)
ALTER TABLE inquiries DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    -- ID DARI HASIL SCREENSHOT BOS
    v_old_id UUID := '50f73f79-a703-4298-96c2-552995c6d893'; 
    -- ID SALES DARI HASIL SCREENSHOT BOS 
    v_new_owner_id UUID := 'd2f0266d-94e4-4ee0-9251-d6cbe0cc34b6';
    
    v_new_id UUID;
    v_exists BOOLEAN;
BEGIN
    -- 0. Cek dulu apakah Lead Lama BENAR-BENAR ADA?
    SELECT EXISTS(SELECT 1 FROM inquiries WHERE id = v_old_id) INTO v_exists;
    
    IF NOT v_exists THEN
        RAISE EXCEPTION '❌ Lead % TIDAK DITEMUKAN. Mungkin sudah terhapus?', v_old_id;
    END IF;

    -- 1. Insert (Clone) Data ke Baris Baru
    INSERT INTO inquiries (
        user_id, status, -- Yang kita ubah
        customer_name, pic, industry, phone, email, -- Data Customer
        origin, destination, weight, dimension, service_type, -- Data Shipment
        est_revenue, est_gp, est_commission, shipment_date -- Data Angka
    )
    SELECT 
        v_new_owner_id, 'Profiling', -- Set Pemilik Baru & Status Profiling
        customer_name, pic, industry, phone, email,
        origin, destination, weight, dimension, service_type,
        est_revenue, est_gp, est_commission, shipment_date
    FROM inquiries 
    WHERE id = v_old_id
    RETURNING id INTO v_new_id;

    IF v_new_id IS NULL THEN
        RAISE EXCEPTION '❌ Gagal membuat Clone! Terjadi Error Aneh.';
    END IF;

    -- 2. Hapus Lead Lama (Supaya tidak duplikat)
    DELETE FROM inquiries WHERE id = v_old_id;

    RAISE NOTICE '✅ SUKSES! Lead Lama (%) DIBUANG. Lead Baru (%) DIBUAT untuk Arif.', v_old_id, v_new_id;
END $$;

-- NYALAKAN RLS LAGI (PENTING!)
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
