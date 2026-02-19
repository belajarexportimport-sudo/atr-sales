-- INVENTORY CHECK (APA YANG TERSISA?)
-- Karena lead '50f7...' menghilang misterius, kita cek apa yang ada sekarang.

-- 1. Total Lead
SELECT count(*) as total_leads FROM inquiries;

-- 2. Lead Kosong (Shark Tank) - Top 10
SELECT id, customer_name, status, user_id 
FROM inquiries 
WHERE user_id IS NULL 
LIMIT 10;

-- 3. Lead Milik Arif - Top 5
SELECT id, customer_name, status, user_id 
FROM inquiries 
WHERE user_id = 'd2f0266d-94e4-4ee0-9251-d6cbe0cc34b6'
LIMIT 5;
