-- FIX INQUIRY VISIBILITY FOR ADMINS
-- Currently, Admins might strictly see only their own inquiries due to active RLS.
-- This script adds a policy allowing Admins to view ALL inquiries.

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it conflicts
DROP POLICY IF EXISTS "Admins can view all inquiries" ON public.inquiries;

-- Create comprehensive viewing policy for Inquiries
CREATE POLICY "Admins can view all inquiries"
ON public.inquiries
FOR SELECT
TO authenticated
USING (
  is_admin() OR auth.uid() = user_id
);

-- Confirmation
SELECT 'Policy Applied. Admins can now view all inquiries.' as result;
