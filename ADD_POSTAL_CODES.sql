
-- Safely add postal code columns
-- MITIGATION 1: Use TEXT to preserve leading zeros (e.g. '01234')
-- MITIGATION 2: Use IF NOT EXISTS to prevent error on re-run
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inquiries' AND column_name = 'origin_postal_code') THEN
        ALTER TABLE inquiries ADD COLUMN origin_postal_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inquiries' AND column_name = 'destination_postal_code') THEN
        ALTER TABLE inquiries ADD COLUMN destination_postal_code TEXT;
    END IF;
END $$;
