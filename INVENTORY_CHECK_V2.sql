-- INVENTORY CHECK V2 (SISA SHARK TANK)
-- Cek apakah masih ada lead lain selain Nugroho yang bisa diambil?

SELECT id, customer_name, pic, status, updated_at
FROM inquiries 
WHERE user_id IS NULL 
ORDER BY created_at DESC 
LIMIT 10;
