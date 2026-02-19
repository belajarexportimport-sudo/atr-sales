-- NUCLEAR REPLACEMENT (CLONE & KILL)
-- Kalau di-Update tidak mempan, kita ganti baru saja barangnya.
-- Strategi:
-- 1. Copy data lead yang macet.
-- 2. Buat Lead BARU yang isinya sama persis TAPI user_id sudah terisi (Milik Arif).
-- 3. Hapus Lead LAMA yang macet.

DO $$
DECLARE
    v_old_id UUID := '50f73f79-a703-4298-96c2-552995c6d893'; -- ID Macet
    v_user_id UUID := 'd2f0266d-94e4-4ee0-9251-d6cbe0cc34b6'; -- ID Arif
    v_new_id UUID;
BEGIN
    -- 1. Insert (Clone) Data ke Baris Baru
    INSERT INTO inquiries (
        user_id, status, -- Yang kita ubah
        customer_name, pic, industry, phone, email, -- Data Customer
        origin, destination, weight, dimension, service_type, -- Data Shipment
        est_revenue, est_gp, est_commission, shipment_date -- Data Angka
    )
    SELECT 
        v_user_id, 'Profiling', -- Set Pemilik Baru & Status Profiling
        customer_name, pic, industry, phone, email,
        origin, destination, weight, dimension, service_type,
        est_revenue, est_gp, est_commission, shipment_date
    FROM inquiries 
    WHERE id = v_old_id
    RETURNING id INTO v_new_id;

    IF v_new_id IS NULL THEN
        RAISE EXCEPTION '❌ Gagal membuat Clone! Lead lama mungkin sudah hilang.';
    END IF;

    -- 2. Hapus Lead Lama (Supaya tidak duplikat)
    DELETE FROM inquiries WHERE id = v_old_id;

    RAISE NOTICE '✅ SUKSES! Lead Lama (%) DIBUANG. Lead Baru (%) DIBUAT untuk Arif.', v_old_id, v_new_id;
END $$;
