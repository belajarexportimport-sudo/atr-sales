-- Allow Anonymous Inserts for Legacy Tool
-- Run this in Supabase SQL Editor

-- 1. Create a policy that allows the 'anon' role (public users/scripts) to INSERT data
CREATE POLICY "Allow Anon Insert for Legacy Tool" ON tracking_events
FOR INSERT 
TO anon
WITH CHECK (true);

-- 2. Also ensure they can SELECT (View) their own inserted data if needed (optional)
-- For now, we just need INSERT permission to fix the error.

-- 3. (Optional) If you want to be safer later, we can add a secret code check, 
-- but for now let's just Open the Gate so the script works.
