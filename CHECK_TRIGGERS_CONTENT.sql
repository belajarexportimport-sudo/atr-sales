-- CHECK ISI TRIGGER FUNCTIONS yang memblokir Revenue update
-- Dari screenshot: ada trigger "on_inquiry_lost" dan "update_inquiries_updated_at"

-- Step 1: Lihat isi function handle_lost_inquiry()
SELECT pg_get_functiondef('handle_lost_inquiry'::regproc);

-- Step 2: Lihat isi function update_updated_at_column()
SELECT pg_get_functiondef('update_updated_at_column'::regproc);

-- Step 3: DISABLE trigger sementara untuk test
ALTER TABLE inquiries DISABLE TRIGGER on_inquiry_lost;
ALTER TABLE inquiries DISABLE TRIGGER update_inquiries_updated_at;

-- Step 4: Test update tanpa trigger
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

-- Step 6: Re-enable triggers
ALTER TABLE inquiries ENABLE TRIGGER on_inquiry_lost;
ALTER TABLE inquiries ENABLE TRIGGER update_inquiries_updated_at;
