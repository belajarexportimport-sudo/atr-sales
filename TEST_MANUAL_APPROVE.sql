-- TEST MANUALLY APPROVING QUOTE
-- Target: 'Test 4 arif' (ID from your screenshot)
-- We will try to update Revenue to 5,000,000

SELECT approve_quote(
    '5f9032f9-a0e2-4f9d-8be8-85bd83f811cb', -- p_inquiry_id
    auth.uid(),                             -- p_approved_by (current user)
    5000000,                                -- p_revenue (Testing with 5 Million)
    1000000                                 -- p_gp
);

-- CHECK RESULT STREAM 
SELECT id, customer_name, est_revenue, quote_status 
FROM inquiries 
WHERE id = '5f9032f9-a0e2-4f9d-8be8-85bd83f811cb';
