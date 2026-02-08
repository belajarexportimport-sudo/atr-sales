-- FIX: Drop trigger that overwrites user_id

-- Common trigger names that might be causing this:
-- 1. set_user_id_trigger
-- 2. handle_inquiry_user
-- 3. set_inquiry_owner

-- Step 1: List all triggers first
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'inquiries';

-- Step 2: Drop the problematic trigger
-- (Run this AFTER you identify which trigger from Step 1)

-- Common culprits:
DROP TRIGGER IF EXISTS set_user_id_trigger ON inquiries;
DROP TRIGGER IF EXISTS handle_inquiry_user ON inquiries;
DROP TRIGGER IF EXISTS set_inquiry_owner ON inquiries;
DROP TRIGGER IF EXISTS before_inquiry_insert ON inquiries;
DROP TRIGGER IF EXISTS before_inquiry_update ON inquiries;

-- Step 3: Verify triggers are gone
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'inquiries';

-- Expected: No triggers that set user_id
