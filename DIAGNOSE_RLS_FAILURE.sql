-- DIAGNOSA RLS: KENA DISINI KAH? 🕵️‍♂️
-- Kita akan mencoba menjadi USER, bukan ADMIN.
-- Ini untuk membuktikan apakah RLS benar-benar memblokir atau tidak.

-- 1. DAFTAR POLICY (Siapa yang boleh ngapain?)
SELECT polname, cmd, qual, with_check 
FROM pg_policy 
WHERE polrelid = 'inquiries'::regclass;

-- 2. SIMULASI SEBAGAI USER BIASA (Pura-pura Login)
-- Kita akan pakai ID Sales test (Arif)
SET ROLE authenticated;
SET request.jwt.claim.sub = 'd2f0266d-94e4-4ee0-9251-d6cbe0cc34b6'; -- ID Arif

-- 3. COBA UPDATE LEAD (Grab)
-- Kita cari dulu satu lead kosong untuk dijadikan korban test
DO $$
DECLARE
    v_lead_id UUID;
    v_sales_id UUID := 'd2f0266d-94e4-4ee0-9251-d6cbe0cc34b6';
BEGIN
    SELECT id INTO v_lead_id FROM inquiries WHERE user_id IS NULL LIMIT 1;

    IF v_lead_id IS NULL THEN
        RAISE NOTICE '⚠️ Tidak ada lead kosong untuk ditest.';
        RETURN;
    END IF;

    RAISE NOTICE '🧪 Test Update Lead ID: %', v_lead_id;

    -- UPDATE MANUAL SEBAGAI USER
    UPDATE inquiries 
    SET user_id = v_sales_id, status = 'Profiling', updated_at = NOW()
    WHERE id = v_lead_id;

    -- CEK HASIL
    IF EXISTS (SELECT 1 FROM inquiries WHERE id = v_lead_id AND user_id = v_sales_id) THEN
        RAISE NOTICE '✅ UPDATE SUKSES! User boleh ambil lead ini.';
    ELSE
        RAISE NOTICE '❌ UPDATE GAGAL! User ditolak (RLS Blocking).';
    END IF;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ ERROR KERAS: %', SQLERRM;
END $$;

-- 4. KEMBALI JADI ADMIN (Supaya script selanjutnya aman)
RESET ROLE;
