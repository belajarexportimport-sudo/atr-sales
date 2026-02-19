-- FORCE ASSIGN SPECIFIC (DIJAMIN KENA)
-- Kita tembak langsung ID Lead yang muncul di screenshot Bos (50f73f79...).
-- Tidak ada lagi random-randoman.

UPDATE inquiries
SET 
  user_id = (SELECT id FROM auth.users WHERE email = 'arifbo54321@gmail.com' LIMIT 1),
  status = 'Profiling',
  updated_at = NOW()
WHERE id = '50f73f79-a703-4298-96c2-552995c6d893'; 
-- ^^^ ID ini dari screenshot Bos yang statusnya 'Profiling' tapi user_id masih NULL

-- Cek hasilnya langsung:
SELECT id, user_id, status 
FROM inquiries 
WHERE id = '50f73f79-a703-4298-96c2-552995c6d893';
