SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'leads' AND (column_name = 'risk_potential' OR column_name = 'status');
