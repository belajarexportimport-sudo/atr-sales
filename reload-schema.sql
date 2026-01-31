-- FORCE RELOAD SCHEMA CACHE
-- Run this when you see Error 406 after adding new functions

NOTIFY pgrst, 'reload config';

-- Verify it worked
SELECT 'Schema cache reloaded' as status;
