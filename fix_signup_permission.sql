-- PERBAIKAN IZIN SEQUENCE SALES CODE
-- Memberi izin kepada sistem untuk mengambil nomor antrian Sales ID
GRANT USAGE, SELECT ON SEQUENCE sales_code_seq TO postgres, authenticated, service_role, anon;

-- Memastikan fungsi generator bisa dijalankan oleh siapa saja
GRANT EXECUTE ON FUNCTION generate_sales_code() TO postgres, authenticated, service_role, anon;

-- Refresh schema cache (opsional tapi bagus)
NOTIFY pgrst, 'reload schema';
