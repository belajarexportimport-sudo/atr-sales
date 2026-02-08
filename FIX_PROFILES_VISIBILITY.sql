-- FIX PROFILES VISIBILITY
-- Ensuring Admins can see ALL profiles (needed for the join to work)

-- 1. Check existing policies on profiles
SELECT polname, polcmd, polroles, polqual FROM pg_policy WHERE polrelid = 'profiles'::regclass;

-- 2. Create/Replace Admin View All Policy for Profiles
DROP POLICY IF EXISTS "admin_view_all_profiles" ON profiles;

CREATE POLICY "admin_view_all_profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
    -- Admin can see all
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    OR
    -- Users can see their own (usually exists, but good to ensure)
    id = auth.uid()
);

-- 3. Verify specifically for the user ID of PT Agra Ali
SELECT * FROM profiles WHERE id = '67cad004-4bcc-4fde-9793-98529ecc32d9';

-- 4. Test the Join Query Simulating Frontend
SELECT 
    i.id as inquiry_id,
    i.customer_name,
    p.full_name as sales_rep
FROM inquiries i
LEFT JOIN profiles p ON i.user_id = p.id
WHERE i.id = '56899564-8fde-4d70-818d-635a7c105563';
