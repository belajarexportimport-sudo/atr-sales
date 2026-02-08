-- CHECK SCHEMA AND FIND DATA

-- 1. Check columns in inquiries table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'inquiries'
ORDER BY column_name;

-- 2. Search for 'PT Agra Ali' (using wildcard select to avoid column errors)
SELECT *
FROM inquiries 
WHERE customer_name ILIKE '%Agra Ali%';
