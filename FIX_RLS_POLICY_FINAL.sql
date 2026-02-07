-- FIX RLS POLICY - CORRECTED VERSION
-- Error sebelumnya: profiles.user_id tidak ada, harusnya profiles.id

-- Step 1: Grant UPDATE permission pada kolom revenue
GRANT UPDATE (est_revenue, est_gp, est_commission) 
ON inquiries 
TO authenticated, anon, service_role;

-- Step 2: Drop policy lama
DROP POLICY IF EXISTS "Admin can update all inquiries" ON inquiries;

-- Step 3: Create policy baru (FIXED - pakai profiles.id, bukan profiles.user_id)
CREATE POLICY "Admin can update all inquiries"
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

-- Step 4: Test update langsung
UPDATE inquiries
SET 
    est_revenue = 6000000,
    est_gp = 5000000,
    est_commission = 100000
WHERE customer_name ILIKE '%gema%'
RETURNING id, customer_name, est_revenue, est_gp, est_commission;

-- Step 5: Verify
SELECT customer_name, est_revenue, est_gp, est_commission
FROM inquiries
WHERE customer_name ILIKE '%gema%';
