-- NUCLEAR OPTION: FORCE SCHEMA CACHE REFRESH
-- Use this if 'reload config' fails to fix Error 406

-- 1. Make a trivial change to force a schema rebuild
COMMENT ON SCHEMA public IS 'Standard public schema - Refreshed';

-- 2. Wait a split second (optional in script, but good for manual run)

-- 3. Revert user/profile permissions just in case
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

SELECT 'Schema cache forcefully refreshed via COMMENT change.' as status;
