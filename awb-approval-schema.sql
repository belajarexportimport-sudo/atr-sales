-- AWB Request & Approval System - Database Schema
-- Run this in Supabase SQL Editor

-- Step 1: Create awb_requests table
CREATE TABLE IF NOT EXISTS awb_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
  sales_rep_id UUID REFERENCES profiles(id),
  sales_initial TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  awb_number TEXT, -- Generated after approval
  requested_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES profiles(id),
  notes TEXT
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_awb_requests_status ON awb_requests(status);
CREATE INDEX IF NOT EXISTS idx_awb_requests_inquiry ON awb_requests(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_awb_requests_sales ON awb_requests(sales_rep_id);

-- Step 2: Create awb_counter table
CREATE TABLE IF NOT EXISTS awb_counter (
  year INTEGER PRIMARY KEY,
  last_number INTEGER DEFAULT 0
);

-- Initialize for current year
INSERT INTO awb_counter (year, last_number) 
VALUES (2026, 0)
ON CONFLICT (year) DO NOTHING;

-- Step 3: Add initials column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS initials TEXT;

-- Set initials for existing users (UPDATE WITH ACTUAL EMAILS)
UPDATE profiles SET initials = 'AD' WHERE email = 'aditatrexpress@gmail.com';
UPDATE profiles SET initials = 'RF' WHERE email = 'arfaibow@gmail.com';

-- Step 4: Add awb_request_id to inquiries table
ALTER TABLE inquiries 
ADD COLUMN IF NOT EXISTS awb_request_id UUID REFERENCES awb_requests(id);

-- Step 5: Create request_awb function
CREATE OR REPLACE FUNCTION request_awb(
  p_inquiry_id UUID,
  p_sales_rep_id UUID,
  p_sales_initial TEXT
)
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
  v_existing_request UUID;
BEGIN
  -- Check if there's already a pending request for this inquiry
  SELECT id INTO v_existing_request
  FROM awb_requests
  WHERE inquiry_id = p_inquiry_id 
  AND status = 'pending';
  
  IF v_existing_request IS NOT NULL THEN
    RETURN v_existing_request;
  END IF;
  
  -- Create new AWB request
  INSERT INTO awb_requests (inquiry_id, sales_rep_id, sales_initial, status)
  VALUES (p_inquiry_id, p_sales_rep_id, p_sales_initial, 'pending')
  RETURNING id INTO v_request_id;
  
  -- Update inquiry
  UPDATE inquiries 
  SET awb_request_id = v_request_id
  WHERE id = p_inquiry_id;
  
  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create approve_awb_request function
CREATE OR REPLACE FUNCTION approve_awb_request(
  p_request_id UUID,
  p_approved_by UUID
)
RETURNS TEXT AS $$
DECLARE
  v_year INTEGER;
  v_next_number INTEGER;
  v_sales_initial TEXT;
  v_awb_number TEXT;
  v_inquiry_id UUID;
BEGIN
  -- Get current year
  v_year := EXTRACT(YEAR FROM NOW());
  
  -- Get sales initial and inquiry_id
  SELECT sales_initial, inquiry_id INTO v_sales_initial, v_inquiry_id
  FROM awb_requests WHERE id = p_request_id;
  
  -- Get and increment counter (atomic operation)
  INSERT INTO awb_counter (year, last_number)
  VALUES (v_year, 1)
  ON CONFLICT (year) DO UPDATE
  SET last_number = awb_counter.last_number + 1
  RETURNING last_number INTO v_next_number;
  
  -- Generate AWB number: ATR-YYYY-XXX-II
  v_awb_number := 'ATR-' || v_year || '-' || LPAD(v_next_number::TEXT, 3, '0') || '-' || v_sales_initial;
  
  -- Update request
  UPDATE awb_requests
  SET status = 'approved',
      awb_number = v_awb_number,
      approved_at = NOW(),
      approved_by = p_approved_by
  WHERE id = p_request_id;
  
  -- Update inquiry
  UPDATE inquiries
  SET awb_number = v_awb_number
  WHERE id = v_inquiry_id;
  
  RETURN v_awb_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create function to get pending requests (for Ops page)
CREATE OR REPLACE FUNCTION get_pending_awb_requests()
RETURNS TABLE (
  request_id UUID,
  inquiry_id UUID,
  customer_name TEXT,
  sales_name TEXT,
  sales_initial TEXT,
  requested_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id as request_id,
    ar.inquiry_id,
    i.customer_name,
    p.full_name as sales_name,
    ar.sales_initial,
    ar.requested_at
  FROM awb_requests ar
  JOIN inquiries i ON ar.inquiry_id = i.id
  JOIN profiles p ON ar.sales_rep_id = p.id
  WHERE ar.status = 'pending'
  ORDER BY ar.requested_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Enable RLS on awb_requests
ALTER TABLE awb_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own requests
CREATE POLICY "Users can view own awb requests" ON awb_requests
FOR SELECT
USING (
  auth.uid() = sales_rep_id OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.super_admin = TRUE)
  )
);

-- Policy: Users can create their own requests
CREATE POLICY "Users can create own awb requests" ON awb_requests
FOR INSERT
WITH CHECK (auth.uid() = sales_rep_id);

-- Policy: Only admins can update requests (approve/reject)
CREATE POLICY "Admins can update awb requests" ON awb_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.super_admin = TRUE)
  )
);

-- Step 9: Verify setup
SELECT 'Setup complete!' as status;

-- Check tables
SELECT 'awb_requests table' as table_name, COUNT(*) as row_count FROM awb_requests
UNION ALL
SELECT 'awb_counter table', COUNT(*) FROM awb_counter
UNION ALL
SELECT 'profiles with initials', COUNT(*) FROM profiles WHERE initials IS NOT NULL;

-- NOTES:
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Update initials for all your sales users
-- 3. Test request_awb() and approve_awb_request() functions
-- 4. Verify RLS policies are working
