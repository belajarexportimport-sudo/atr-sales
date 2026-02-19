-- FORCE ASSIGN SIMPLE (LANGSUNG JALAN)
-- Script ini lebih gampang & anti-ribet.
-- Tidak perlu bingung tanda kutip atau DO $$.
-- Asumsi Email: 'arifbo54321@gmail.com' (sesuai screenshot Anda).

-- 1. Update Lead Kosong -> Jadi Milik Arif
UPDATE inquiries
SET 
  user_id = (SELECT id FROM auth.users WHERE email = 'arifbo54321@gmail.com' LIMIT 1),
  status = 'Profiling', 
  updated_at = NOW()
WHERE id = (
  SELECT id FROM inquiries 
  WHERE user_id IS NULL -- Cari lead yang masih kosong (sembarang)
  LIMIT 1
);

-- 2. Tampilkan Hasilnya
SELECT id as lead_id, customer_name, status, user_id 
FROM inquiries 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'arifbo54321@gmail.com' LIMIT 1)
ORDER BY updated_at DESC
LIMIT 5;
