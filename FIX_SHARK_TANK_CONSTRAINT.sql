-- FIX SHARK TANK STATUS CONSTRAINT
-- The 'Shark Tank' feature (Open Market) uses the status 'UNASSIGNED'.
-- However, the original database schema likely restricts the 'status' column to a specific list.
-- This script updates the check constraint to allow 'UNASSIGNED'.

-- 1. Drop existing constraint
ALTER TABLE inquiries 
DROP CONSTRAINT IF EXISTS inquiries_status_check;

-- 2. Add updated constraint including 'UNASSIGNED'
ALTER TABLE inquiries 
ADD CONSTRAINT inquiries_status_check 
CHECK (status IN (
  'Profiling', 
  'Proposal', 
  'Negotiation', 
  'Won', 
  'Lost', 
  'Invoiced', 
  'Paid', 
  'Overdue', 
  'UNASSIGNED' -- Added for Shark Tank
));

-- 3. Verify
SELECT 'Constraint updated successfully' as message;
