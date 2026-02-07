-- UPDATE PT GEMA LANGSUNG
-- Ganti Revenue PT Gema jadi 6000000

UPDATE inquiries
SET 
    est_revenue = 6000000,
    est_gp = 5000000,
    est_commission = 100000
WHERE customer_name ILIKE '%gema%'
RETURNING id, customer_name, est_revenue, est_gp, est_commission;

-- Verify
SELECT customer_name, est_revenue, est_gp, est_commission
FROM inquiries
WHERE customer_name ILIKE '%gema%';
