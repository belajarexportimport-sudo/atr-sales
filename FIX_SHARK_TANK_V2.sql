-- FIX: Shark Tank "Grab" Functionality V2 (DEBUG)
-- This version adds detailed error reporting to help diagnose the 400 error.

-- 1. Drop to ensure clean slate
DROP FUNCTION IF EXISTS grab_lead(UUID, UUID);

-- 2. Create ROBUST & DEBUGGABLE function
CREATE OR REPLACE FUNCTION grab_lead(lead_id UUID, grabber_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lead_exists BOOLEAN;
    v_lead_status TEXT;
    v_grabber_exists BOOLEAN;
    affected_rows INTEGER;
BEGIN
    -- DEBUG 1: Verify Grabber Exists
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = grabber_id) INTO v_grabber_exists;
    IF NOT v_grabber_exists THEN
        RAISE EXCEPTION 'Grabber (User) ID not found: %', grabber_id;
    END IF;

    -- DEBUG 2: Verify Lead Exists and Status
    SELECT status INTO v_lead_status FROM inquiries WHERE id = lead_id;
    IF v_lead_status IS NULL THEN
        RAISE EXCEPTION 'Lead ID not found: %', lead_id;
    END IF;

    -- DEBUG 3: Attempt Update
    UPDATE inquiries
    SET 
        user_id = grabber_id,
        status = 'Profiling', -- Ensure this matches Case Sensitive constraint
        updated_at = NOW()
    WHERE 
        id = lead_id 
        AND user_id IS NULL;
        
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    IF affected_rows > 0 THEN
        RETURN TRUE; -- Success
    ELSE
        -- If no rows affected, check why
        IF EXISTS (SELECT 1 FROM inquiries WHERE id = lead_id AND user_id IS NOT NULL) THEN
             RAISE EXCEPTION 'Lead already taken by someone else.';
        ELSE
             RAISE EXCEPTION 'Update failed for unknown reason. Lead: %, User: %', lead_id, grabber_id;
        END IF;
    END IF;

EXCEPTION WHEN OTHERS THEN
    -- Capture generic SQL errors (like constraint violations)
    RAISE EXCEPTION 'Grab Error: %', SQLERRM;
END;
$$;

-- 3. Grant Permissions
GRANT EXECUTE ON FUNCTION grab_lead(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION grab_lead(UUID, UUID) TO service_role;

SELECT 'Shark Tank Grab Function V2 (Debug) Installed!' as status;
