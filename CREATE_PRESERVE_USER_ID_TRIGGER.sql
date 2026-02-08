-- FINAL SOLUTION: Database Trigger to Preserve user_id
-- This trigger FORCES user_id to NEVER change on UPDATE

-- Step 1: Create function to preserve user_id
CREATE OR REPLACE FUNCTION preserve_inquiry_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is an UPDATE (not INSERT)
    IF TG_OP = 'UPDATE' THEN
        -- FORCE preserve original user_id
        NEW.user_id := OLD.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Drop existing trigger if any
DROP TRIGGER IF EXISTS preserve_user_id_trigger ON inquiries;

-- Step 3: Create trigger that runs BEFORE UPDATE
CREATE TRIGGER preserve_user_id_trigger
    BEFORE UPDATE ON inquiries
    FOR EACH ROW
    EXECUTE FUNCTION preserve_inquiry_user_id();

-- Step 4: Verify trigger created
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'inquiries'
AND trigger_name = 'preserve_user_id_trigger';

-- Expected: 1 row showing the trigger
