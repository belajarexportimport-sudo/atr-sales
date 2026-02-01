-- CREATE APPROVE_USER RPC
-- This function is called by OperationsPage.jsx to approve a new user.

CREATE OR REPLACE FUNCTION public.approve_user(
  p_user_id UUID,
  p_initials TEXT,
  p_approved_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updater_role TEXT;
BEGIN
  -- 1. Check if the approver is an admin
  SELECT role INTO v_updater_role FROM public.profiles WHERE id = p_approved_by;
  
  IF v_updater_role IS DISTINCT FROM 'admin' THEN
     RETURN jsonb_build_object('error', 'Unauthorized: Only admins can approve users');
  END IF;

  -- 2. Update the target user profile
  UPDATE public.profiles
  SET 
    approved = TRUE,
    initials = UPPER(p_initials),
    role = 'sales' -- Ensure they get sales role
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'User approved successfully');

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

SELECT 'Function approve_user created successfully' as status;
