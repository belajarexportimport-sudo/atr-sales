-- DIAGNOSE REVENUE FUNCTION
SELECT 
  routine_name, 
  parameter_name, 
  data_type, 
  ordinal_position 
FROM information_schema.parameters 
WHERE routine_name = 'approve_quote' 
ORDER BY ordinal_position;
