-- CHECK SIGNATURES
SELECT proname, proargtypes, prorettype 
FROM pg_proc 
WHERE proname = 'get_pending_commissions';
