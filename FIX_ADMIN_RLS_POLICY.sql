-- FIX RLS POLICY - Allow Admin to UPDATE Revenue/GP
-- Masalah: Admin tidak bisa update est_revenue, est_gp, est_commission
-- Solusi: Tambah policy khusus untuk admin

-- 1. Drop policy lama yang mungkin konflik
DROP POLICY IF EXISTS "Admin can update all inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admin full access" ON inquiries;

-- 2. Buat policy baru yang BENAR untuk admin UPDATE
CREATE POLICY "Admin can update all inquiry fields"
ON inquiries
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- 3. Test langsung - Update inquiry dengan Revenue/GP
-- Ganti UUID dengan inquiry yang baru Anda buat
UPDATE inquiries
SET 
    est_revenue = 5000000,
    est_gp = 4000000,
    est_commission = 80000
WHERE customer_name ILIKE '%asih%'  -- Ganti dengan customer name yang baru
RETURNING id, customer_name, est_revenue, est_gp, est_commission;

-- 4. Cek hasilnya
SELECT 
    customer_name,
    est_revenue,
    est_gp,
    est_commission,
    quote_status,
    status
FROM inquiries
WHERE customer_name ILIKE '%asih%'
ORDER BY created_at DESC
LIMIT 3;
