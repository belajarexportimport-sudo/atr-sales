-- Add AWB Number field to inquiries table
-- Run this in Supabase SQL Editor

ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS awb_number TEXT;

-- Create index for faster AWB lookups
CREATE INDEX IF NOT EXISTS idx_inquiries_awb_number ON inquiries(awb_number);

-- Migration complete!
