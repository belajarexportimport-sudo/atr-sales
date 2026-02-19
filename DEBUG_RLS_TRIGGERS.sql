-- MATIKAN RLS SEMENTARA & CEK TRIGGERS
-- Langkah ini untuk memastikan tidak ada "Satpam" (RLS) yang menghalangi update.

-- 1. Matikan RLS di tabel inquiries (Supaya UPDATE pasti masuk)
ALTER TABLE inquiries DISABLE ROW LEVEL SECURITY;

-- 2. Cek apakah ada Trigger aneh yang aktif?
SELECT tgname AS trigger_name
FROM pg_trigger
WHERE tgrelid = 'inquiries'::regclass;

-- 3. COBA UPDATE LAGI (Force Specific)
UPDATE inquiries
SET 
  user_id = (SELECT id FROM auth.users WHERE email = 'arifbo54321@gmail.com' LIMIT 1),
  status = 'Profiling',
  updated_at = NOW()
WHERE id = '50f73f79-a703-4298-96c2-552995c6d893';

-- 4. Lihat Hasilnya (Harusnya User ID sudah terisi!)
SELECT id, user_id, status 
FROM inquiries 
WHERE id = '50f73f79-a703-4298-96c2-552995c6d893';
