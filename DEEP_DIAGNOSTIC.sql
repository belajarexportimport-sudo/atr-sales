-- === DEEP DIAGNOSTIC: Why Save Fails? ===

-- 1. Check Table Structure & NOT NULL constraints
SELECT 
    table_name, 
    column_name, 
    is_nullable, 
    column_default, 
    data_type
FROM information_schema.columns 
WHERE table_name IN ('inquiries', 'leads')
AND (is_nullable = 'NO' AND column_default IS NULL)
ORDER BY table_name;

-- 2. Check CHECK Constraints
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid::regclass::text IN ('inquiries', 'leads')
AND contype = 'c';

-- 3. Check RLS Policies
SELECT 
    tablename, 
    policyname, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename IN ('inquiries', 'leads');

-- 4. Check Current User Identity & Admin Status
SELECT 
    auth.uid() as current_user_id,
    p.email,
    p.role,
    public.is_admin() as is_admin_result
FROM public.profiles p
WHERE p.id = auth.uid();

-- 5. Check Active Triggers
SELECT 
    event_object_table AS table_name, 
    trigger_name, 
    event_manipulation AS event, 
    action_timing AS timing,
    action_statement AS statement
FROM information_schema.triggers 
WHERE event_object_table IN ('inquiries', 'leads');

-- 6. Check for Foreign Key issues
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('inquiries', 'leads');
