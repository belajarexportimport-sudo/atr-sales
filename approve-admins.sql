-- Auto-approve admin accounts
-- Run this in Supabase SQL Editor

-- Approve both admin emails
UPDATE profiles 
SET approved = TRUE, 
    approved_at = NOW()
WHERE email IN ('aditatrexpress@gmail.com', 'arfaibow@gmail.com');

-- Verify
SELECT email, role, approved, approved_at 
FROM profiles 
WHERE email IN ('aditatrexpress@gmail.com', 'arfaibow@gmail.com');

-- Result should show both emails with approved = TRUE
