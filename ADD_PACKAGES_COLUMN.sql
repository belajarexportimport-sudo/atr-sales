
-- Safely add packages column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'inquiries'
        AND column_name = 'packages'
    ) THEN
        ALTER TABLE inquiries ADD COLUMN packages JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;
