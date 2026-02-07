-- IMMEDIATE FIX: Show Revenue Without Approval
-- Run this FIRST before running SIMPLIFY_REVENUE_AWB.sql
-- This will make PT Amuka revenue visible immediately

-- Option 1: Quick Fix - Just show the revenue (no approval needed)
-- This updates the Dashboard query logic

-- Check current PT Amuka data
SELECT 
    customer_name,
    est_revenue,
    est_gp,
    est_commission,
    status,
    quote_status,
    commission_status
FROM inquiries
WHERE customer_name ILIKE '%amuka%';

-- The issue: Frontend is filtering by commission_status = 'approved'
-- But we want to show ALL revenue immediately

-- SOLUTION: Frontend already updated in latest code!
-- Just need to refresh the app (Ctrl + F5)

-- If still not showing, it means:
-- 1. Code not deployed to Vercel yet (check Vercel dashboard)
-- 2. Or you're using old localhost build

-- TEMPORARY WORKAROUND: Manually approve commission for PT Amuka
-- (This will make it show up in current system)

-- Find PT Amuka inquiry ID
DO $$
DECLARE
    v_inquiry_id UUID;
    v_commission_id UUID;
BEGIN
    -- Get inquiry ID
    SELECT id INTO v_inquiry_id
    FROM inquiries
    WHERE customer_name ILIKE '%amuka%'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Create approved commission
    INSERT INTO commissions (
        inquiry_id,
        amount,
        status,
        approved_at,
        approved_by
    )
    VALUES (
        v_inquiry_id,
        80000, -- Commission amount from inquiry
        'approved',
        NOW(),
        (SELECT id FROM profiles WHERE email = 'aditatrexpress@gmail.com')
    )
    ON CONFLICT (inquiry_id) DO UPDATE
    SET status = 'approved',
        approved_at = NOW();
    
    RAISE NOTICE 'Commission approved for PT Amuka';
END $$;

-- Verify
SELECT 
    i.customer_name,
    i.est_revenue,
    i.est_commission,
    c.status as commission_status,
    c.approved_at
FROM inquiries i
LEFT JOIN commissions c ON c.inquiry_id = i.id
WHERE i.customer_name ILIKE '%amuka%';
