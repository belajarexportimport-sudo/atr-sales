-- === MATIKAN SYSTEM KEAMANAN (Sementara) ===
-- Tujuannya agar DATA MUNCUL DULU. Jangan panik.
-- Setelah data muncul, baru kita set kunci lagi nanti.

-- 1. Matikan RLS di Tabel Profiles (Biar Admin bisa lihat semua Sales)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Matikan RLS di Tabel Inquiries (Biar Data Transaksi muncul semua)
ALTER TABLE public.inquiries DISABLE ROW LEVEL SECURITY;

-- 3. Hapus Policy yang mungkin menyangkut/error
DROP POLICY IF EXISTS "Inquiry Access" ON public.inquiries;
DROP POLICY IF EXISTS "Universal Inquiry Access" ON public.inquiries;
DROP POLICY IF EXISTS "Allow All View" ON public.profiles;

SELECT '✅ SECURITY DISABLED. DATA SHOULD APPEAR NOW.' as status;
