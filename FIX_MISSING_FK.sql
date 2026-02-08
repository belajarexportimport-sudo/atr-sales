-- FIX MISSING FOREIGN KEY
-- The diagnostic showed that inquiries(user_id) does NOT have a foreign key to profiles(id).
-- This is why the join fails with 400.

-- 1. Check for orphans first (inquiries with user_id that doesn't exist in profiles)
SELECT count(*) as orphan_count 
FROM inquiries 
WHERE user_id IS NOT NULL 
AND user_id NOT IN (SELECT id FROM profiles);

-- 2. Add the Foreign Key Constraint
-- We wrap in a block to safely add it only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'inquiries_user_id_fkey'
    ) THEN
        ALTER TABLE inquiries
        ADD CONSTRAINT inquiries_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES profiles(id)
        ON UPDATE CASCADE;  -- Good practice usually
    END IF;
END $$;

-- 3. Reload Schema Cache (Vital)
NOTIFY pgrst, 'reload schema';

-- 4. Verify it exists now
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'inquiries' AND constraint_type = 'FOREIGN KEY';
