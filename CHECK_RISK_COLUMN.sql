SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'inquiries' AND (column_name = 'risk_potential' OR column_name = 'status');
