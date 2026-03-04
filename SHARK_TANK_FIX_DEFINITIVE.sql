-- ============================================
-- ATR SALES PWA - SHARK TANK DIAGNOSIS & REPAIR
-- ============================================
-- 1. Check data status
-- 2. Clean up conflicting RLS policies
-- 3. Apply definitive visibility rules
-- ============================================

-- STEP 1: DIAGNOSIS (Check actual counts)
SELECT 
    'Total Inquiries' as check_name, COUNT(*) as count FROM public.inquiries
UNION ALL
SELECT 
    'Unassigned (Shark Tank)', COUNT(*) FROM public.inquiries WHERE user_id IS NULL
UNION ALL
SELECT 
    'Unassigned & Profiling', COUNT(*) FROM public.inquiries WHERE user_id IS NULL AND status = 'Profiling';

-- STEP 2: REPAIR RLS (DROP ALL PREVIOUS ATTEMPTS)
DO $$ 
DECLARE 
    pol record;
BEGIN 
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'inquiries') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.inquiries', pol.policyname);
    END LOOP;
END $$;

-- STEP 3: DEFINITIVE VISIBILITY RULES (v6.1)
-- ALLOW SELECT
CREATE POLICY "inquiries_select_v6"
ON public.inquiries FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()             -- Own RFQ
    OR user_id IS NULL               -- Shark Tank (Marketplace)
    OR (
        -- Admin check (using profile role)
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    )
);

-- ALLOW UPDATE (To Grab)
CREATE POLICY "inquiries_update_v6"
ON public.inquiries FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()             -- Own RFQ
    OR user_id IS NULL               -- Can update to grab
    OR (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    )
)
WITH CHECK (
    user_id = auth.uid()             -- Can grab to self
    OR (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    )
);

-- ALLOW INSERT (For Manual & GSheet via Service Role)
-- Service role bypasses RLS anyway, this is for manual UI
CREATE POLICY "inquiries_insert_v6"
ON public.inquiries FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid() 
    OR (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    )
);

-- RE-ENABLE RLS (Safeguard)
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- STEP 4: RESULT
SELECT 'Shark Tank Fix v6.1 Applied Successfully!' as status;
