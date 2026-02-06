-- CHECK TABLE SCHEMA & TRIGGERS
-- Inspect column definitions
SELECT column_name, data_type, column_default, is_generated 
FROM information_schema.columns 
WHERE table_name = 'inquiries';

-- Inspect Triggers
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'inquiries';
