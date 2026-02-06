-- CHECK MY ROLE
-- Run this to see what role your email has
SELECT email, role, full_name 
FROM profiles 
WHERE email = 'aditatrexpress@gmail.com'; 
-- Or just list all admins
SELECT email, role FROM profiles WHERE role = 'admin';
