-- TEST 1: Direct INSERT (Bypass Everything)
-- This will tell us if the problem is RLS, trigger, or frontend

INSERT INTO inquiries (
    user_id,
    customer_name,
    est_revenue,
    est_gp,
    est_commission,
    status,
    quote_status
) VALUES (
    (SELECT id FROM profiles WHERE email = 'aditatrexpress@gmail.com'),
    'TEST DIRECT INSERT',
    999999,
    750000,
    15000,
    'Profiling',
    'Pending'
) RETURNING id, customer_name, est_revenue, est_gp, est_commission;

-- If this works (revenue = 999999), problem is FRONTEND
-- If this fails (revenue = NULL or ERROR), problem is BACKEND (RLS/Trigger)
