-- FORCE ADMIN ROLE & DIAGNOSE

-- 1. Check current profile for aditatrexpress@gmail.com (Implicitly identified admin)
SELECT * FROM profiles WHERE email = 'aditatrexpress@gmail.com';

-- 2. FORCE UPDATE role to 'admin' for this user
UPDATE profiles
SET role = 'admin'
WHERE email = 'aditatrexpress@gmail.com';

-- 3. Also update based on ID if we can find it in auth.users (cannot access auth.users directly easily in all contexts, but profiles should track it)
-- If you are logged in as someone else, replace the email above!

-- 4. Verify RLS is enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE oid = 'inquiries'::regclass;

-- 5. Create a "Super Policy" that bypasses everything for testing
-- WARNING: This allows basic authenticated users to see meaningful data if is_admin fails
DROP POLICY IF EXISTS "emergency_view_all" ON inquiries;

CREATE POLICY "emergency_view_all"
ON inquiries
FOR SELECT
TO authenticated
USING (
   -- Allow if role is admin OR email is the specific admin email
   (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
   OR
   (SELECT email FROM profiles WHERE id = auth.uid()) = 'aditatrexpress@gmail.com'
);

-- 6. Check if data exists again
SELECT count(*) as pending_count FROM inquiries WHERE quote_status = 'Pending';
