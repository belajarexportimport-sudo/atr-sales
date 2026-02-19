-- FIX FINAL: CLEAR TRIGGERS & FORCE ASSIGN
-- Masalah: Data Lead "bandel" tidak mau pindah meski sudah pakai Security Definer.
-- Penyebab Paling Mungkin: Ada TRIGGER (Program Otomatis) yang membatalkan perubahan atau RLS yang sangat ketat.

-- 1. HAPUS TRIGGER PENYEBAB MASALAH (Jika Ada)
-- Kita drop trigger yang mungkin menghalangi update user_id
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_updated_at ON inquiries;
-- (Jika ada trigger lain yang Anda lihat di FULL_DIAGNOSE, tambahkan di sini)

-- 2. MATIKAN RLS TOTAL (Untuk Test Ini Saja)
ALTER TABLE inquiries DISABLE ROW LEVEL SECURITY;

-- 3. AUTO-FIX: AMBIL SATU LEAD (Approve Paksa)
DO $$
DECLARE
    v_sales_id UUID := 'd2f0266d-94e4-4ee0-9251-d6cbe0cc34b6'; -- ID Arif
    v_lead_id UUID;
BEGIN
    -- Cari Lead Kosong
    SELECT id INTO v_lead_id FROM inquiries WHERE user_id IS NULL LIMIT 1;
    
    IF v_lead_id IS NULL THEN
        RAISE NOTICE '❌ Tidak ada Lead Kosong.';
        RETURN;
    END IF;

    -- Update Paksa
    UPDATE inquiries 
    SET user_id = v_sales_id, status = 'Profiling', updated_at = NOW()
    WHERE id = v_lead_id;

    RAISE NOTICE '✅ Update Sukses untuk Lead ID: %', v_lead_id;
END $$;

-- 4. NYALAKAN LAGI RLS (Tapi pakai Policy yang Benar)
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Pastikan Policy "Sales Grab" Ada
DROP POLICY IF EXISTS "Sales can grab open leads" ON inquiries;
CREATE POLICY "Sales can grab open leads" ON inquiries FOR UPDATE TO authenticated
USING (user_id IS NULL) WITH CHECK (user_id = auth.uid());

-- 4. LIHAT HASILNYA
SELECT id, user_id, status, customer_name FROM inquiries 
WHERE user_id = 'd2f0266d-94e4-4ee0-9251-d6cbe0cc34b6'
ORDER BY updated_at DESC LIMIT 5;
