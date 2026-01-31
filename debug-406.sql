-- DEBUG & FIX 406 ERROR
-- 1. Cek apakah data bisa dibaca via SQL (Harus muncul hasil)
SELECT * FROM profiles LIMIT 3;

-- 2. Toggle RLS (Matikan-Hidupkan) untuk memaksa "Refresh" status tabel Profiles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- Wait handled by execution time
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Pastikan izin akses SELECT (Baca) terbuka lebar untuk semua user
GRANT SELECT ON profiles TO anon, authenticated, service_role;

-- 4. Sentil ulang konfigurasi
NOTIFY pgrst, 'reload config';

SELECT 'Fix applied. Try refreshing browser now.' as status;
