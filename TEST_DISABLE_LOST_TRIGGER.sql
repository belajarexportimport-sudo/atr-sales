-- TEST: Disable trigger on_inquiry_lost dan test update

-- Step 1: Disable trigger on_inquiry_lost
ALTER TABLE inquiries DISABLE TRIGGER on_inquiry_lost;

-- Step 2: Test update Revenue/GP
UPDATE inquiries
SET 
    est_revenue = 6000000,
    est_gp = 5000000,
    est_commission = 100000
WHERE customer_name ILIKE '%gema%'
RETURNING id, customer_name, est_revenue, est_gp, est_commission;

-- Step 3: Verify
SELECT customer_name, est_revenue, est_gp, est_commission
FROM inquiries
WHERE customer_name ILIKE '%gema%';

-- Step 4: Re-enable trigger
ALTER TABLE inquiries ENABLE TRIGGER on_inquiry_lost;

-- KALAU Step 2-3 BERHASIL (Revenue jadi 6000000):
-- Berarti trigger on_inquiry_lost yang menyebabkan masalah
-- Kita perlu fix atau disable permanent trigger ini
