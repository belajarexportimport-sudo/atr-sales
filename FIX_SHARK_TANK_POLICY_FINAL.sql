-- FIX UPDATE POLICY: FORCE USER ID IS NULL
-- Screenshot bos: Policy Update hanya: ((auth.uid() = user_id))
-- Ini SALAH BESAR untuk Shark Tank, karena user_id-nya NULL.

-- 1. DROP POLICY LAMA (YANG SALAH)
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON inquiries;

-- 2. BUAT POLICY BARU YANG BENAR
-- Izinkan update kalau:
-- A. Punya saya (auth.uid() = user_id)
-- B. ATAU Masih Kosong (user_id IS NULL) --> INI YANG HILANG DI SCREENSHOT!

CREATE POLICY "Enable update for users based on user_id" ON inquiries FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (true); 

-- 3. VERIFIKASI LANGSUNG (QUERY PG_POLICIES)
-- Kita print policy baru supaya Bos bisa lihat bedanya.
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '✅ Policy Update Baru:';
    FOR r IN (
        SELECT policyname, qual, with_check 
        FROM pg_policies 
        WHERE tablename = 'inquiries' AND cmd = 'UPDATE'
    ) LOOP
        RAISE NOTICE 'Policy: %, Qual: %, Check: %', r.policyname, r.qual, r.with_check;
    END LOOP;
END $$;
