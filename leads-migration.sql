-- ATR Sales CRM - Leads Management Migration
-- Run this in Supabase SQL Editor to add Leads functionality

-- Step 1: Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  pic_name TEXT,
  phone TEXT,
  email TEXT,
  industry TEXT,
  status TEXT DEFAULT 'Cold' CHECK (status IN ('Cold', 'Warm', 'Hot')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Step 2: Add lead_id to inquiries table
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;

-- Step 3: Update inquiries status constraint to include 'Paid'
ALTER TABLE inquiries DROP CONSTRAINT IF EXISTS inquiries_status_check;
ALTER TABLE inquiries ADD CONSTRAINT inquiries_status_check 
  CHECK (status IN ('Profiling', 'Proposal', 'Negotiation', 'Won', 'Lost', 'Invoiced', 'Paid', 'Overdue'));

-- Step 4: Enable RLS for leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for leads
CREATE POLICY "Users can view own leads" ON leads
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email = 'aditatrexpress@gmail.com'
    )
  );

CREATE POLICY "Users can insert own leads" ON leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leads" ON leads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own leads" ON leads
  FOR DELETE USING (auth.uid() = user_id);

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_inquiries_lead_id ON inquiries(lead_id);

-- Step 7: Create trigger for leads updated_at
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration complete!
-- You can now use the Leads management features in the CRM.
