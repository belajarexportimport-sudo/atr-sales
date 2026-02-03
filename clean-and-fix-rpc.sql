-- CLEANUP & FIX RPC (SOLUSI FINAL)
-- Masalah: Ada 2 fungsi 'approve_commission' yang kembar tapi beda (Duplikat). 
-- Ini membuat database bingung dan operasi gagal.

-- 1. Hapus SEMUA versi fungsi 'approve_commission' yang ada (Reset Bersih)
DROP FUNCTION IF EXISTS public.approve_commission(UUID, DECIMAL);
DROP FUNCTION IF EXISTS public.approve_commission(UUID, UUID, DECIMAL);

-- 2. Buat ulang SATU fungsi yang benar (Versi Final 3 Argumen)
CREATE OR REPLACE FUNCTION public.approve_commission(
  p_inquiry_id UUID,
  p_approved_by UUID,
  p_commission_amount DECIMAL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.inquiries
  SET 
      commission_approved = TRUE,
      commission_approved_at = NOW(),
      commission_approved_by = p_approved_by,
      -- Simpan nilai final yang disetujui (COALESCE untuk jaga-jaga tidak null)
      commission_amount = COALESCE(p_commission_amount, est_commission, 0),
      est_commission = COALESCE(p_commission_amount, est_commission, 0)
  WHERE id = p_inquiry_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Berikan izin akses
GRANT EXECUTE ON FUNCTION public.approve_commission(UUID, UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_commission(UUID, UUID, DECIMAL) TO service_role;

-- 4. Verifikasi (Opsional - untuk memastikan sudah bersih)
SELECT p.proname, p.proargnames 
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE n.nspname = 'public' 
AND p.proname = 'approve_commission';
