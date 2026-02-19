-- DEEP DIVE: APAKAH ADA 'GHOST' DI TABEL INQUIRIES? 👻
-- Kita akan cek semua Trigger, Rule, dan Policy yang aktif.

SELECT 
    trg.tgname AS trigger_name,
    CASE trg.tgtype::integer & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END AS trigger_type,
    case trg.tgtype::integer & cast(28 as int2)
        when 4 then 'INSERT'
        when 8 then 'DELETE'
        when 12 then 'INSERT OR DELETE'
        when 16 then 'UPDATE'
        when 20 then 'INSERT OR UPDATE'
        when 24 then 'UPDATE OR DELETE'
        when 28 then 'INSERT OR UPDATE OR DELETE'
        when 32 then 'TRUNCATE'
    end as trigger_event,
    pro.proname AS function_name
FROM pg_trigger trg
JOIN pg_class tbl ON trg.tgrelid = tbl.oid
JOIN pg_proc pro ON trg.tgfoid = pro.oid
WHERE tbl.relname = 'inquiries'
  AND NOT trg.tgisinternal;

-- Cek RLS Policies lagi untuk memastikan
select * from pg_policies where tablename = 'inquiries';

-- Cek apakah user_id bisa di-update manual via SQL untuk Lead yang stuck tadi?
-- (Kita hardcode ID dari screenshot user: e505ec35...)
DO $$
DECLARE
    v_stuck_id UUID := 'e505ec35-35ca-4f0a-a46d-18f34e9d5e96'; 
    v_sales_id UUID := 'd2f0266d-94e4-4ee0-9251-d6cbe0cc34b6'; -- Arif
BEGIN
    -- Coba update paksa lewat backend langsung
    UPDATE inquiries 
    SET user_id = v_sales_id, status = 'Profiling', updated_at = NOW()
    WHERE id = v_stuck_id;
    
    -- Cek apakah nempel?
    IF EXISTS (SELECT 1 FROM inquiries WHERE id = v_stuck_id AND user_id = v_sales_id) THEN
        RAISE NOTICE '✅ SQL UPDATE BERHASIL: User ID tersimpan. Masalah ada di permission API/App.';
    ELSE
        RAISE NOTICE '❌ SQL UPDATE GAGAL: User ID tetap NULL. Ada Trigger/Constraint yang memblokir.';
    END IF;
END $$;
