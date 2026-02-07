-- CEK APAKAH RPC approve_quote SUDAH BENAR
-- Jalankan di Supabase SQL Editor

-- 1. Cek signature function approve_quote
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'approve_quote';

-- Harusnya ada 4 parameter:
-- p_inquiry_id UUID, p_approved_by UUID, p_revenue NUMERIC, p_gp NUMERIC

-- 2. Jika tidak ada atau signature salah, jalankan ulang FIX_ALL_OPS_RPC.sql
