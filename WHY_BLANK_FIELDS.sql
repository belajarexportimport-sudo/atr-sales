-- ============================================
-- DIAGNOSTIC: Why Revenue Fields Blank?
-- ============================================

-- POSSIBILITY 1: User role is not 'admin'
-- Frontend checks: profile?.role === 'admin'
-- If role != 'admin', fields won't show!

SELECT 
    id,
    email,
    role,
    full_name,
    created_at
FROM profiles
WHERE email = 'aditatrexpress@gmail.com';

-- Expected: role = 'admin' (lowercase)
-- If role is NULL, 'sales', or anything else, FIX IT:

UPDATE profiles
SET role = 'admin'
WHERE email = 'aditatrexpress@gmail.com';

-- After UPDATE, you MUST:
-- 1. LOGOUT from app
-- 2. LOGIN again
-- 3. Revenue fields will appear!

-- ============================================

-- POSSIBILITY 2: Frontend not deployed yet
-- Check Vercel deployment status
-- Latest commit: 5d938cd
-- If Vercel still deploying old code, revenue fields won't show

-- Solution: Wait 2-3 minutes for Vercel to finish deploying
