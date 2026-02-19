-- FIX: Shark Tank "Grab" Functionality V3 (AMBIGUOUS HELPER)
-- Problem: The parameter 'lead_id' conflicts with the column 'lead_id' in the inquiries table.
-- Solution: Rename parameters to 'p_lead_id' and 'p_grabber_id'.

-- 1. Drop old function (Important to remove the old signature)
DROP FUNCTION IF EXISTS grab_lead(UUID, UUID);

-- 2. Create FIXED function with unique parameter names
CREATE OR REPLACE FUNCTION grab_lead(p_lead_id UUID, p_grabber_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_grabber_exists BOOLEAN;
    affected_rows INTEGER;
BEGIN
    -- DEBUG 1: Verify Grabber Exists
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_grabber_id) INTO v_grabber_exists;
    IF NOT v_grabber_exists THEN
        RAISE EXCEPTION 'Grabber (User) ID not found: %', p_grabber_id;
    END IF;

    -- DEBUG 2: Attempt Update
    UPDATE inquiries
    SET 
        user_id = p_grabber_id,
        status = 'Profiling',
        updated_at = NOW()
    WHERE 
        id = p_lead_id 
        AND user_id IS NULL; -- Ensure it's still unassigned
        
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    IF affected_rows > 0 THEN
        RETURN TRUE; -- Success
    ELSE
        RETURN FALSE; -- Failed (Already taken or not found)
    END IF;

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Grab Error (V3): %', SQLERRM;
END;
$$;

-- 3. Grant Permissions
GRANT EXECUTE ON FUNCTION grab_lead(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION grab_lead(UUID, UUID) TO service_role;

SELECT 'Shark Tank Grab Function V3 (Ambiguity Fixed) Installed!' as status;
