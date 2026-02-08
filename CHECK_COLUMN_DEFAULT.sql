-- CHECK FOR COLUMN DEFAULT ON user_id

-- Step 1: Check column definition for DEFAULT value
SELECT 
    column_name,
    column_default,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'inquiries'
AND column_name = 'user_id';

-- Step 2: Check for BEFORE UPDATE trigger that sets user_id
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'inquiries'
AND action_timing = 'BEFORE'
AND event_manipulation = 'UPDATE';

-- Step 3: If Step 1 shows DEFAULT = auth.uid() or similar:
-- This is the problem! DEFAULT overrides explicit values!

-- EXPECTED PROBLEM:
-- column_default = 'auth.uid()'
-- This means every UPDATE sets user_id to current auth user!

-- SOLUTION:
-- Remove DEFAULT constraint from user_id column
