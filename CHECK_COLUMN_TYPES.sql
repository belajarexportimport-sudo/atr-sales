-- CHECK COLUMN TYPES
SELECT 
    table_name, 
    column_name, 
    data_type, 
    udt_name
FROM information_schema.columns
WHERE (table_name = 'inquiries' AND column_name IN ('user_id', 'commission_approved_by'))
   OR (table_name = 'profiles' AND column_name = 'id');
