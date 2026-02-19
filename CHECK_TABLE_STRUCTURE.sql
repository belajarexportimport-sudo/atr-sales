-- CEK STRUKTUR DATABASE (Dimana Leads Disimpan?)
-- Kita cek apakah ada tabel khusus bernama 'leads'?
-- Atau semuanya di 'inquiries'?

-- 1. DAFTAR SEMUA TABEL DI DATABASE
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. CEK STRUKTUR TABEL 'inquiries' (Kolom apa saja yang ada?)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'inquiries'
ORDER BY ordinal_position;

-- 3. APAKAH ADA TABEL 'leads'? (Cek Khusus)
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'leads'
);
