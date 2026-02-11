-- LIST ALL TRIGGERS AND THEIR FUNCTIONS
SELECT 
    event_object_table as table_name,
    trigger_name,
    event_manipulation as event,
    action_statement as definition
FROM information_schema.triggers
WHERE event_object_table = 'inquiries'
ORDER BY event_object_table, trigger_name;

-- CHECK FOR HTTP EXTENSIONS OR WRAPPERS
SELECT * FROM pg_extension WHERE extname = 'net' OR extname = 'http';
