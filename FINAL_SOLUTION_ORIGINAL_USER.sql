-- FINAL SOLUTION: Add original_user_id column

-- Problem: user_id keeps changing to admin
-- Root cause: Supabase auth context behavior (unfixable)
-- Solution: Store original creator in separate column

-- Step 1: Add new column for original creator
ALTER TABLE inquiries 
ADD COLUMN IF NOT EXISTS original_user_id uuid;

-- Step 2: Populate with current user_id for existing records
UPDATE inquiries
SET original_user_id = user_id
WHERE original_user_id IS NULL;

-- Step 3: Create trigger to auto-set on INSERT
CREATE OR REPLACE FUNCTION set_original_user_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.original_user_id IS NULL THEN
        NEW.original_user_id := NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Attach trigger
DROP TRIGGER IF EXISTS set_original_user_id_trigger ON inquiries;
CREATE TRIGGER set_original_user_id_trigger
    BEFORE INSERT ON inquiries
    FOR EACH ROW
    EXECUTE FUNCTION set_original_user_id();

-- Step 5: Verify
SELECT 
    customer_name,
    user_id,
    original_user_id,
    est_revenue
FROM inquiries
ORDER BY created_at DESC
LIMIT 5;

-- Now:
-- - user_id can change (we don't care)
-- - original_user_id NEVER changes (for commission tracking)
-- - Frontend uses original_user_id for sales attribution
