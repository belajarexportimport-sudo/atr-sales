-- DEBUG & FIX: Stuck Commission Approval

-- 1. Cek Data Inquiry "Test3" (yang muncul di screenshot)
-- Kita lihat status commission_approved sebenarnya apa
SELECT 
    id, 
    customer_name, 
    status, 
    est_commission, 
    commission_approved, 
    commission_status
FROM inquiries 
WHERE customer_name ILIKE '%Test3%';

-- 2. FORCE RE-APPLY Logic yang Benar (Untuk memastikan Function di Database 100% Benar)
-- Terkadang function lama masih nyangkut ("Ambiguous Function")

-- Hapus dulu yang lama (Deep Clean)
DROP FUNCTION IF EXISTS public.approve_commission(UUID, DECIMAL);
DROP FUNCTION IF EXISTS public.approve_commission(UUID, UUID, DECIMAL);
DROP FUNCTION IF EXISTS public.get_pending_commissions();

-- Buat Ulang Function Approve (Versi Final)
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
      commission_amount = COALESCE(p_commission_amount, est_commission, 0),
      est_commission = COALESCE(p_commission_amount, est_commission, 0),
      -- Tambahan: Pastikan status komisi jadi Unpaid (bukan null) supaya muncul di dashboard Sales
      commission_status = CASE WHEN commission_status IS NULL THEN 'Unpaid' ELSE commission_status END
  WHERE id = p_inquiry_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Buat Ulang Function Get Pending (Versi Final)
CREATE OR REPLACE FUNCTION get_pending_commissions()
RETURNS TABLE (
  inquiry_id UUID,
  sales_rep TEXT,
  customer_name TEXT,
  est_revenue DECIMAL,
  est_gp DECIMAL,
  est_commission DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id as inquiry_id,
    p.full_name as sales_rep,
    i.customer_name,
    i.est_revenue,
    i.est_gp,
    i.est_commission,
    i.created_at
  FROM inquiries i
  JOIN profiles p ON i.user_id = p.id
  WHERE i.est_commission > 0 
  -- Hanya tampilkan yang BELUM diapprove
  AND (i.commission_approved IS NULL OR i.commission_approved = FALSE)
   ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant Permissions
GRANT EXECUTE ON FUNCTION public.approve_commission(UUID, UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_commission(UUID, UUID, DECIMAL) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_pending_commissions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_commissions() TO service_role;

-- 3. Cek lagi setelah perbaikan (Simulasi lihat pending list)
SELECT * FROM get_pending_commissions();
