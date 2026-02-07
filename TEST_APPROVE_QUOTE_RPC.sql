-- TEST APPROVE_QUOTE RPC
-- Jalankan di Supabase SQL Editor untuk test manual

-- STEP 1: Buat inquiry dummy untuk test
INSERT INTO inquiries (
    user_id,
    customer_name,
    origin,
    destination,
    service_type,
    est_weight,
    status,
    quote_status
) VALUES (
    (SELECT id FROM profiles WHERE email = 'aditatrexpress@gmail.com' LIMIT 1),
    'TEST CUSTOMER - DELETE ME',
    'JKT',
    'SBY',
    'Reguler',
    10,
    'Quotation',
    'Pending'
) RETURNING id;

-- Copy ID dari hasil query di atas, lalu jalankan:

-- STEP 2: Test RPC approve_quote
SELECT approve_quote(
    'PASTE-INQUIRY-ID-HERE'::uuid,  -- Ganti dengan ID dari step 1
    (SELECT id FROM profiles WHERE email = 'aditatrexpress@gmail.com' LIMIT 1),
    5000000,  -- Revenue
    4000000   -- GP
);

-- STEP 3: Cek apakah tersimpan
SELECT 
    customer_name,
    est_revenue,
    est_gp,
    est_commission,
    status,
    quote_status,
    commission_status
FROM inquiries
WHERE customer_name = 'TEST CUSTOMER - DELETE ME';

-- Harusnya:
-- est_revenue = 5000000
-- est_gp = 4000000
-- est_commission = 80000 (2% dari GP)
-- status = 'Proposal'
-- quote_status = 'Approved'
-- commission_status = 'Pending'

-- STEP 4: Hapus test data
DELETE FROM inquiries WHERE customer_name = 'TEST CUSTOMER - DELETE ME';
