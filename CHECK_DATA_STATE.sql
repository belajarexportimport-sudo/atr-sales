-- DIAGNOSTIC DATA CHECK
-- Script ini untuk memastikan:
-- 1. Apakah user 'arifbo54321@gmail.com' BENAR-BENAR ada?
-- 2. Apakah ada lead kosong di Shark Tank?

SELECT 
    (SELECT count(*) FROM auth.users WHERE email = 'arifbo54321@gmail.com') as user_exists,
    (SELECT count(*) FROM inquiries WHERE user_id IS NULL) as open_shark_tank_leads,
    (SELECT count(*) FROM inquiries WHERE status = 'UNASSIGNED') as unassigned_status_leads;

-- LIST USER VALID (Top 5)
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- LIST OPEN LEADS (Top 5)
SELECT id, origin, destination, status FROM inquiries WHERE user_id IS NULL LIMIT 5;
