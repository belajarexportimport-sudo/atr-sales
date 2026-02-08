-- ROOT CAUSE FOUND: NOT-NULL constraint, bukan RLS!
-- Test INSERT dengan SEMUA required fields

INSERT INTO inquiries (
    user_id,
    customer_name,
    origin,
    destination,
    service_type,
    est_revenue,
    est_gp,
    est_commission,
    status,
    quote_status
) VALUES (
    (SELECT id FROM profiles WHERE email = 'aditatrexpress@gmail.com'),
    'TEST COMPLETE INSERT',
    'Jakarta',
    'Singapore',
    'Air Freight',
    999999,
    750000,
    15000,
    'Profiling',
    'Pending'
) RETURNING id, customer_name, origin, destination, est_revenue, est_gp, est_commission;

-- Kalau ini SUCCESS dengan revenue = 999999, berarti:
-- ✅ RLS OK
-- ✅ Database OK
-- ❌ Problem di FRONTEND (tidak kirim semua required fields)
