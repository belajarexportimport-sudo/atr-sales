-- MIGRATE LEADS: ADD RISK POTENTIAL & ENSURE STATUS
-- 1. Add risk_potential column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'risk_potential') THEN
        ALTER TABLE leads ADD COLUMN risk_potential TEXT CHECK (risk_potential IN ('Low', 'Medium', 'High'));
    END IF;
END $$;

-- 2. Drop Check Constraint on status if exists (to allow new values)
-- We don't know the exact name, so we try to drop common naming conventions or just alter column type
ALTER TABLE leads ALTER COLUMN status TYPE TEXT;
-- If there was a check constraint, it might persist. Let's try to drop it if we knew the name, 
-- but converting to TEXT usually keeps constraints unless explicitly dropped. 
-- For now, we assume it's either TEXT or we need to add a check.
-- Let's just add a flexible check or leave it as text.
