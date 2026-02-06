-- CHECK APPROVE_COMMISSION SOURCE (CORRECTED)
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'approve_commission';
