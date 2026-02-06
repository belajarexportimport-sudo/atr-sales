-- CHECK FUNCTION SOURCE (FIXED)
-- Lihat isi kode fungsi yang aktif sekarang
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'approve_quote';
