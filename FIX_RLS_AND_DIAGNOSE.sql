-- FIX: RLS & Permissions for Shark Tank
-- 1. Ensures Sales can SEE Open Leads (user_id IS NULL)
-- 2. Ensures Sales can SEE/EDIT leads they just grabbed (user_id = auth.uid())
-- 3. Adds a Diagnostic Tool to check lead status

-- A. RLS POLICIES -------------------------
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 1. Allow Viewing Open Leads (Shark Tank)
DROP POLICY IF EXISTS "Enable read access for open leads" ON inquiries;
CREATE POLICY "Enable read access for open leads"
ON inquiries FOR SELECT
USING (user_id IS NULL);

-- 2. Allow Viewing/Editing Own Leads (Already exists, but reinforcing)
DROP POLICY IF EXISTS "Users can view own inquiries" ON inquiries;
CREATE POLICY "Users can view own inquiries"
ON inquiries FOR SELECT
USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can update own inquiries" ON inquiries;
CREATE POLICY "Users can update own inquiries"
ON inquiries FOR UPDATE
USING ( auth.uid() = user_id );

-- B. DIAGNOSTIC TOOL ----------------------
-- Run this tool by passing a Lead ID to check clearly what its status is.
CREATE OR REPLACE FUNCTION diagnose_lead(target_lead_id UUID)
RETURNS TABLE (
    lead_id UUID,
    owner_id UUID,
    status TEXT,
    is_open BOOLEAN,
    last_updated TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id, 
        user_id, 
        status, 
        (user_id IS NULL) as is_open,
        updated_at
    FROM inquiries
    WHERE id = target_lead_id;
END;
$$ LANGUAGE plpgsql;

SELECT 'RLS Fixed & Diagnostic Tool Installed' as status;
