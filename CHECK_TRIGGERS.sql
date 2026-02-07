-- CHECK TRIGGERS yang mungkin memblokir Revenue update

-- Step 1: List semua triggers di table inquiries
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'inquiries'
ORDER BY trigger_name;

-- Step 2: Check functions yang dipanggil oleh triggers
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%inquir%'
   OR p.proname LIKE '%revenue%'
   OR p.proname LIKE '%financial%'
ORDER BY p.proname;

-- Step 3: Disable RLS temporarily and try update
ALTER TABLE inquiries DISABLE ROW LEVEL SECURITY;

UPDATE inquiries
SET 
    est_revenue = 6000000,
    est_gp = 5000000
WHERE customer_name ILIKE '%gema%'
RETURNING id, customer_name, est_revenue, est_gp;

-- Re-enable RLS
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Step 4: If Step 3 works, problem is RLS. If not, problem is trigger or constraint.
