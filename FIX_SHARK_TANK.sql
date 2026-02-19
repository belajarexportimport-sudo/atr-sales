-- FIX: Shark Tank "Grab" Functionality
-- 1. Fixes Invalid Status 'PROSPECTING' (Constraint Violation) -> Sets to 'Profiling'
-- 2. Fixes Permissions (Adds SECURITY DEFINER to bypass RLS)
-- 3. Removes strict 'UNASSIGNED' status check (Allows grabbing any NULL user_id lead)

CREATE OR REPLACE FUNCTION grab_lead(lead_id UUID, grabber_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- CRITICAL: Runs as Superuser to allow taking ownership
AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Update the inquiry to assign it to the grabber
    UPDATE inquiries
    SET 
        user_id = grabber_id,
        status = 'Profiling', -- FIXED: Use a valid status from CHECK constraint
        updated_at = NOW()
    WHERE 
        id = lead_id 
        AND user_id IS NULL; -- CRITICAL: Ensure it's still unassigned
        
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    IF affected_rows > 0 THEN
        RETURN TRUE; -- Success
    ELSE
        RETURN FALSE; -- Failed (Already taken or not found)
    END IF;
END;
$$;

-- Grant permissions explicitly
GRANT EXECUTE ON FUNCTION grab_lead(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION grab_lead(UUID, UUID) TO service_role;

SELECT 'Shark Tank Grab Function Fixed!' as status;
