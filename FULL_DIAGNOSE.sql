-- DEEP DIAGNOSTIC (MENCARI BIANG KEROK)
-- Script ini AKAN MEMPERLIHATKAN aturan tersembunyi (Trigger & RLS) di tabel Inquiries.

-- 1. CEK TRIGGERS (Apakah ada Robot yang membatalkan update?)
SELECT tgname, tgenabled, tgtype, tgrelid::regclass 
FROM pg_trigger 
WHERE tgrelid = 'inquiries'::regclass;

-- 2. CEK RLS POLICIES (Aturan Satpam)
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'inquiries';

-- 3. JANGAN-JANGAN STATUSNYA BUKAN NULL?
-- Cek 5 Lead 'Shark Tank' (Status apapun asal User Kosong)
SELECT id, status, user_id, 
       created_at, updated_at 
FROM inquiries 
WHERE user_id IS NULL 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. CEK LEAD MILIK ARIF (d2f0...)
SELECT id, status, user_id, customer_name
FROM inquiries 
WHERE user_id = 'd2f0266d-94e4-4ee0-9251-d6cbe0cc34b6';
