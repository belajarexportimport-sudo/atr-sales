-- Add "Won - Verification at WHS" status to inquiries table constraint
-- Run this in Supabase SQL Editor

-- Step 1: Drop existing constraint
ALTER TABLE inquiries 
DROP CONSTRAINT IF EXISTS inquiries_status_check;

-- Step 2: Add new constraint with updated status list
ALTER TABLE inquiries 
ADD CONSTRAINT inquiries_status_check 
CHECK (status IN (
    'Profiling',
    'Proposal', 
    'Negotiation',
    'Won',
    'Won - Verification at WHS',
    'Lost',
    'Invoiced',
    'Paid',
    'Overdue'
));

-- Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'inquiries'::regclass 
AND conname = 'inquiries_status_check';
