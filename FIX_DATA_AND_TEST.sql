
-- 1. FORCE Ensure the user is admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'aditatrexpress@gmail.com';

-- 2. FORCE 'PT Agra Ali' to correct 'Pending' status (Case Sensitive fix)
UPDATE inquiries
SET quote_status = 'Pending'
WHERE customer_name ILIKE '%Agra Ali%';

-- 3. INSERT a fresh Test Quote (To verify if NEW data shows up)
INSERT INTO inquiries (
    user_id, 
    customer_name, 
    origin, 
    destination, 
    service_type, 
    quote_status, 
    status, -- corrected value
    created_at, 
    est_revenue, 
    est_gp
)
SELECT 
    id, -- use the admin's own ID as the creator
    'TEST PENDING DATA (From Recovery)', 
    'Jakarta', 
    'Bali',
    'Udara', 
    'Pending', 
    'Proposal', -- CHANGED from 'Lead' to 'Proposal' (Valid Status)
    NOW(), 
    500000, 
    100000
FROM profiles
WHERE email = 'aditatrexpress@gmail.com';

-- 4. VERIFY: Show me what we have now
SELECT id, customer_name, quote_status 
FROM inquiries 
WHERE quote_status = 'Pending';
