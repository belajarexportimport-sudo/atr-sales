-- Quick check: Is your user actually admin?
SELECT 
    id,
    email,
    role,
    full_name
FROM profiles
WHERE email = 'aditatrexpress@gmail.com';

-- Expected: role should be 'admin' (lowercase)
-- If role is NULL or 'sales', that's why fields are blank!
