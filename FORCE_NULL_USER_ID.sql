-- FORCE USER_ID TO BE OPTIONAL (NULLABLE)
-- This is required for "Shark Tank" / Unassigned leads.

BEGIN;

-- 1. Drop the NOT NULL constraint (if it exists)
ALTER TABLE inquiries ALTER COLUMN user_id DROP NOT NULL;

-- 2. Ensure RLS allows admins to insert/update with NULL
-- (This part repeats the critical policy logic just in case)
DROP POLICY IF EXISTS "Admins can do everything" ON inquiries;
CREATE POLICY "Admins can do everything"
ON inquiries
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

COMMIT;
