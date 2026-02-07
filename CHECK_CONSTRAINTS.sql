-- CHECK CONSTRAINTS dan TRIGGERS yang memblokir Revenue update
-- Sudah terbukti BUKAN RLS (test disable RLS gagal)

-- Step 1: Check table constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'inquiries'::regclass
ORDER BY conname;

-- Step 2: Check column constraints specifically for revenue columns
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'inquiries'
AND column_name IN ('est_revenue', 'est_gp', 'est_commission')
ORDER BY column_name;

-- Step 3: Check for CHECK constraints on revenue columns
SELECT
    tc.constraint_name,
    tc.table_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'inquiries';

-- Step 4: List ALL triggers on inquiries table
SELECT
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'inquiries'
ORDER BY trigger_name;

-- Step 5: Try DIRECT update with explicit casting
UPDATE inquiries
SET 
    est_revenue = 6000000::numeric,
    est_gp = 5000000::numeric,
    est_commission = 100000::numeric
WHERE id = (SELECT id FROM inquiries WHERE customer_name ILIKE '%gema%' LIMIT 1)
RETURNING id, customer_name, est_revenue, est_gp, est_commission;
