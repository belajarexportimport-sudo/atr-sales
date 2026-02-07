-- Upgrade arfaibow to admin
UPDATE profiles
SET role = 'admin'
WHERE email ILIKE '%arfaibow%';

-- Verify the change
SELECT id, email, role FROM profiles WHERE email ILIKE '%arfaibow%';
