-- Check Profiles Initials
SELECT email, full_name, initials, role FROM profiles;

-- Check AWB Number Generation Function
SELECT pg_get_functiondef('generate_awb_number'::regproc);
