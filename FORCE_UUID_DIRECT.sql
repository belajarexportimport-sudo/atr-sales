-- FORCE UPDATE DIRECT (UUID to UUID)
-- Kita bypass semua "pencarian via email" yang mungkin error.
-- Kita pakai UUID langsung yang tadi Bos temukan (d2f0266d...).

-- 1. Matikan RLS (Doble Check)
ALTER TABLE inquiries DISABLE ROW LEVEL SECURITY;

-- 2. Update Paksa dengan ID Langsung
UPDATE inquiries
SET 
  user_id = 'd2f0266d-94e4-4ee0-9251-d6cbe0cc34b6', -- ID Sales Bos
  status = 'Profiling',
  updated_at = NOW()
WHERE id = '50f73f79-a703-4298-96c2-552995c6d893'; -- ID Lead Bos

-- 3. Nyalakan Lagi RLS (Supaya Aman)
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 4. Lihat Hasilnya
SELECT id, user_id, status 
FROM inquiries 
WHERE id = '50f73f79-a703-4298-96c2-552995c6d893';
