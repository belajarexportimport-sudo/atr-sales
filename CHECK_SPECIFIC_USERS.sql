-- Check profile for arfaibow (using email partial match)
SELECT id, email, role, full_name 
FROM profiles 
WHERE email ILIKE '%arfaibow%' OR email ILIKE '%aditatrexpress%';
