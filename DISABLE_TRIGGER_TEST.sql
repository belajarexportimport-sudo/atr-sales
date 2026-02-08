-- TEMPORARY FIX: Disable update_inquiries_updated_at trigger

-- Step 1: Disable the trigger temporarily
ALTER TABLE inquiries DISABLE TRIGGER update_inquiries_updated_at;

-- Step 2: Test UPDATE without trigger
UPDATE inquiries
SET est_revenue = 8888888
WHERE customer_name ILIKE '%Angkasa%';

-- Step 3: Check if user_id changed
SELECT 
    customer_name,
    user_id,
    est_revenue,
    updated_at
FROM inquiries
WHERE customer_name ILIKE '%Angkasa%';

-- Step 4: If user_id is UNCHANGED:
-- ✅ The trigger was the problem!
-- We need to fix the trigger function

-- Step 5: Re-enable trigger (after we fix it)
-- ALTER TABLE inquiries ENABLE TRIGGER update_inquiries_updated_at;
