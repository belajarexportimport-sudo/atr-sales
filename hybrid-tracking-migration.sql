-- Hybrid Tracking System Migration
-- Run this in Supabase SQL Editor

-- 1. Create tracking_events table
CREATE TABLE IF NOT EXISTS tracking_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  awb_number TEXT NOT NULL,
  status TEXT NOT NULL, -- 'In Transit', 'Delivered', etc.
  location TEXT,
  description TEXT,
  is_manual BOOLEAN DEFAULT true, -- true = manual from Ops, false = from API
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id), -- Admin/Ops who updated it
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Everyone (Authenticated) can VIEW tracking events (Sales need to see matches)
CREATE POLICY "Authenticated users can view events" ON tracking_events
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only Admins/Ops can INSERT/UPDATE (For now, we allow all auth users to SIMPLIFY testing)
-- In production, you would check profile.role = 'admin'
CREATE POLICY "Users can insert events" ON tracking_events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_tracking_events_awb ON tracking_events(awb_number);
CREATE INDEX IF NOT EXISTS idx_tracking_events_date ON tracking_events(occurred_at);

-- 5. Migration Complete
