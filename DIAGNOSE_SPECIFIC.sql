/*
DIAGNOSTIC UNTUK: d2f0266d-94e4-4ee0-9251-d6cbe0cc34b6
DAN EMAIL: arifbo54321@gmail.com
*/

-- 1. Cek User 'arifbo54321@gmail.com' (Apakah ADA?)
SELECT id, email, created_at, role 
FROM auth.users 
WHERE email = 'arifbo54321@gmail.com';

-- 2. Cek Lead 'd2f0266d-94e4-4ee0-9251-d6cbe0cc34b6' (Siapa Pemilik Sekarang?)
SELECT id, user_id, status, created_at, updated_at
FROM inquiries
WHERE id = 'd2f0266d-94e4-4ee0-9251-d6cbe0cc34b6';

-- 3. Cek Semua Lead User Tersebut (Apakah Sudah Masuk?)
SELECT id, status, updated_at
FROM inquiries
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'arifbo54321@gmail.com');
