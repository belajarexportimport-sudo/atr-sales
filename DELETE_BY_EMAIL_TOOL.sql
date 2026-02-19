-- FIX: DELETE BY EMAIL
-- Use this specialized function to delete a specific email from auth.users (and cascades to profiles)
-- This is useful if the user doesn't know the ID or if the user is "invisible".

CREATE OR REPLACE FUNCTION force_delete_user_by_email(target_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  -- Check if user exists first
  SELECT COUNT(*) INTO v_count FROM auth.users WHERE email = target_email;
  
  IF v_count = 0 THEN
    RETURN 'User not found: ' || target_email;
  END IF;

  -- Delete from auth.users (Cascades to profiles)
  DELETE FROM auth.users WHERE email = target_email;
  
  RETURN 'Deleted user: ' || target_email;
END;
$$;

-- Grant permissions so you can run it
GRANT EXECUTE ON FUNCTION force_delete_user_by_email TO authenticated;
GRANT EXECUTE ON FUNCTION force_delete_user_by_email TO service_role;

-- Usage Example:
-- SELECT force_delete_user_by_email('email_yg_bermasalah@gmail.com');

SELECT 'Function force_delete_user_by_email created successfully.' as status;
