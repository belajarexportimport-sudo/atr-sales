-- CHECK: Is your user actually ADMIN?
-- This will verify your admin status

SELECT 
    id,
    email,
    role,
    created_at
FROM profiles
WHERE email = 'aditatrexpress@gmail.com';

-- EXPECTED RESULT:
-- role should be 'admin' (lowercase)

-- If role is NULL or 'sales', that's the problem!
-- Frontend checks: profile?.role === 'admin'
-- If role != 'admin', revenue fields won't show!

-- FIX (if role is wrong):
UPDATE profiles
SET role = 'admin'
WHERE email = 'aditatrexpress@gmail.com';

-- Then LOGOUT and LOGIN again to refresh session!
