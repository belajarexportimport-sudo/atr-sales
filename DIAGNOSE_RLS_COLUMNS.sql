-- DIAGNOSE: Check RLS policies for inquiries table
-- Masalah: Revenue/GP dikirim tapi tidak tersimpan, Commission tersimpan

-- Step 1: Check all RLS policies on inquiries table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'inquiries'
ORDER BY policyname;

-- Step 2: Check if there are column-level permissions
SELECT 
    table_name,
    column_name,
    privilege_type
FROM information_schema.column_privileges
WHERE table_name = 'inquiries'
AND column_name IN ('est_revenue', 'est_gp', 'est_commission');

-- Step 3: Check for triggers that might block updates
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'inquiries';

-- Step 4: FORCE GRANT UPDATE on revenue columns
GRANT UPDATE (est_revenue, est_gp, est_commission) 
ON inquiries 
TO authenticated, anon, service_role;

-- Step 5: Ensure RLS policy allows admin to update these columns
DROP POLICY IF EXISTS "Admin can update all inquiries" ON inquiries;

CREATE POLICY "Admin can update all inquiries"
ON inquiries
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Step 6: Test update directly
UPDATE inquiries
SET 
    est_revenue = 6000000,
    est_gp = 5000000,
    est_commission = 100000
WHERE customer_name ILIKE '%gema%'
RETURNING id, customer_name, est_revenue, est_gp, est_commission;
