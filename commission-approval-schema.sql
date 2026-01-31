-- Commission Approval System - Database Schema
-- Run this in Supabase SQL Editor

-- Step 1: Add commission_approved column to inquiries
ALTER TABLE inquiries 
ADD COLUMN IF NOT EXISTS commission_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS commission_approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS commission_approved_by UUID REFERENCES profiles(id);

-- Step 2: Create function to approve commission
CREATE OR REPLACE FUNCTION approve_commission(
  p_inquiry_id UUID,
  p_approved_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE inquiries
  SET commission_approved = TRUE,
      commission_approved_at = NOW(),
      commission_approved_by = p_approved_by
  WHERE id = p_inquiry_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Verify setup
SELECT 'Commission Approval System setup complete!' as status;

-- Check inquiries table
SELECT id, customer_name, est_commission, commission_approved 
FROM inquiries 
LIMIT 5;

-- NOTES:
-- 1. Existing inquiries have commission_approved = FALSE by default
-- 2. Admin can approve commission from RFQ form
-- 3. Sales can only see commission amount after approval
-- 4. Formula (2%) is hidden from sales users
