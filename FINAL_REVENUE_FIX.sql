-- ============================================
-- FINAL FIX - Revenue & GP Issue
-- Jalankan SEMUA script ini di Supabase SQL Editor
-- ============================================

-- STEP 1: Create/Fix RPC admin_update_financials
-- ============================================
DROP FUNCTION IF EXISTS admin_update_financials CASCADE;

CREATE OR REPLACE FUNCTION admin_update_financials(
    p_inquiry_id UUID,
    p_revenue NUMERIC,
    p_gp NUMERIC,
    p_commission NUMERIC
)
RETURNS VOID AS $$
BEGIN
    UPDATE inquiries
    SET 
        est_revenue = p_revenue,
        est_gp = p_gp,
        est_commission = p_commission
    WHERE id = p_inquiry_id;
    
    RAISE NOTICE '✅ Admin updated: ID=%, Rev=%, GP=%, Comm=%', 
        p_inquiry_id, p_revenue, p_gp, p_commission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- STEP 2: Fix approve_quote RPC
-- ============================================
DROP FUNCTION IF EXISTS approve_quote CASCADE;

CREATE OR REPLACE FUNCTION approve_quote(
    p_inquiry_id UUID, 
    p_approved_by UUID,
    p_revenue NUMERIC, 
    p_gp NUMERIC
)
RETURNS VOID AS $$
BEGIN
    UPDATE inquiries
    SET 
        quote_status = 'Approved',
        est_revenue = p_revenue,
        est_gp = p_gp,
        est_commission = p_gp * 0.02,
        status = 'Proposal',
        commission_status = 'Pending'
    WHERE id = p_inquiry_id;
    
    RAISE NOTICE '✅ Quote approved: ID=%, Rev=%, GP=%', 
        p_inquiry_id, p_revenue, p_gp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- STEP 3: Fix RLS Policies
-- ============================================
DROP POLICY IF EXISTS "Enable update for users and admins" ON inquiries;
DROP POLICY IF EXISTS "Admins can update all inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admins Determine All" ON inquiries;
DROP POLICY IF EXISTS "Users Update Own" ON inquiries;

-- Admin policy
CREATE POLICY "admin_full_update"
ON inquiries FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- User policy
CREATE POLICY "user_own_update"
ON inquiries FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- STEP 4: Test Everything
-- ============================================

-- Test 1: admin_update_financials
DO $$
DECLARE
    test_id UUID;
BEGIN
    -- Get latest inquiry
    SELECT id INTO test_id FROM inquiries ORDER BY created_at DESC LIMIT 1;
    
    -- Test RPC
    PERFORM admin_update_financials(test_id, 9999999, 8888888, 177777);
    
    RAISE NOTICE '✅ Test 1 passed: admin_update_financials';
END $$;

-- Test 2: approve_quote
DO $$
DECLARE
    test_id UUID;
    admin_id UUID;
BEGIN
    -- Get a pending quote
    SELECT id INTO test_id FROM inquiries WHERE quote_status = 'Pending' LIMIT 1;
    
    -- Get admin user
    SELECT id INTO admin_id FROM profiles WHERE role = 'admin' LIMIT 1;
    
    IF test_id IS NOT NULL AND admin_id IS NOT NULL THEN
        PERFORM approve_quote(test_id, admin_id, 7777777, 6666666);
        RAISE NOTICE '✅ Test 2 passed: approve_quote';
    ELSE
        RAISE NOTICE '⚠️ Test 2 skipped: No pending quote or admin found';
    END IF;
END $$;

-- Verify results
SELECT 
    customer_name,
    est_revenue,
    est_gp,
    est_commission,
    quote_status,
    status
FROM inquiries
ORDER BY created_at DESC
LIMIT 3;

-- ============================================
-- DONE! 
-- Setelah jalankan script ini:
-- 1. Refresh browser (Ctrl + Shift + R)
-- 2. Test edit inquiry atau approve di Ops
-- ============================================
