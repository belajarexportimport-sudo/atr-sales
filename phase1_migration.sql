-- PHASE 1 MIGRATION: OPEN POOL & SALES ID

-- 1. Enable Open Leads (Allow NULL user_id) ---------------------------------
ALTER TABLE inquiries ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add 'UNASSIGNED' to Status Check (if exists) ---------------------------
-- Note: If status is just TEXT without constraint, this is optional but good for documentation.
-- We check existing constraints first. If no constraint, we just document it.
-- Assuming 'status' is TEXT. We will just use 'UNASSIGNED' in the app logic.

-- 3. Add Sales ID Code (Anonymity) to Profiles ------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sales_code TEXT UNIQUE;

-- Function to auto-generate Sales Code (e.g., 'SALES-1001')
CREATE SEQUENCE IF NOT EXISTS sales_code_seq START 1001;

CREATE OR REPLACE FUNCTION generate_sales_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sales_code IS NULL THEN
        NEW.sales_code := 'SALES-' || nextval('sales_code_seq');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to assign sales_code on new profile creation
DROP TRIGGER IF EXISTS trigger_generate_sales_code ON profiles;
CREATE TRIGGER trigger_generate_sales_code
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION generate_sales_code();

-- Backfill existing profiles with Sales Code
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM profiles WHERE sales_code IS NULL LOOP
        UPDATE profiles
        SET sales_code = 'SALES-' || nextval('sales_code_seq')
        WHERE id = r.id;
    END LOOP;
END $$;

-- 4. Create RPC for "Grab Lead" (Atomic Locking) ----------------------------
CREATE OR REPLACE FUNCTION grab_lead(lead_id UUID, grabber_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE inquiries
    SET 
        user_id = grabber_id,
        status = 'PROSPECTING', -- Auto-change status to 'PROSPECTING' upon grab
        updated_at = NOW()
    WHERE 
        id = lead_id 
        AND user_id IS NULL -- CRITICAL: Ensure it's still unassigned
        AND status = 'UNASSIGNED'; -- CRITICAL: Ensure it's in the pool
        
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    IF affected_rows > 0 THEN
        RETURN TRUE; -- Success
    ELSE
        RETURN FALSE; -- Failed (Probably taken by someone else)
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions logic (important for RLS)
GRANT EXECUTE ON FUNCTION grab_lead(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION grab_lead(UUID, UUID) TO service_role;
