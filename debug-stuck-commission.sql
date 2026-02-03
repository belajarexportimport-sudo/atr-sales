-- DIAGNOSTIC SCRIPT
-- Check "Test3" inquiry status
SELECT id, customer_name, status, est_revenue, est_gp, est_commission, commission_amount, commission_approved 
FROM inquiries 
WHERE customer_name LIKE '%Test3%';

-- Check Function Definitions (Arguments)
SELECT p.proname, p.proargnames, p.prosrc 
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE n.nspname = 'public' 
AND p.proname IN ('approve_commission', 'get_pending_commissions');
