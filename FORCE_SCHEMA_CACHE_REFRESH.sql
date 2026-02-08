-- FORCE SCHEMA RELOAD via RLS TOGGLE
-- Sometimes 'NOTIFY pgrst' is ignored or lost. 
-- Changing a table property forces PostgREST to rebuild its schema cache.

-- 1. Disable RLS temporarily
ALTER TABLE inquiries DISABLE ROW LEVEL SECURITY;

-- 2. Wait a tick (simulated by separate statement)
-- In a script, this just runs sequentially.

-- 3. Re-enable RLS (Critical security feature)
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 4. Re-verify the constraint is still there
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'inquiries' AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'inquiries_user_id_fkey';
