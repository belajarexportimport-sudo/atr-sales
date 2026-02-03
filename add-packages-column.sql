-- Migration: Add Multi-Collie Support
-- Author: Antigravity
-- Date: 2026-02-03

-- 1. Add 'packages' column (JSONB) to store array of package details
-- Format: [{ weight: 10, dimension: "10x10x10", type: "Box", commodity: "Electronics" }]
ALTER TABLE public.inquiries 
ADD COLUMN IF NOT EXISTS packages JSONB DEFAULT '[]'::jsonb;

-- 2. Add 'commodity' column (Global commodity if needed, or fallback)
ALTER TABLE public.inquiries 
ADD COLUMN IF NOT EXISTS commodity TEXT;

-- 3. Add 'package_type' column (Global type if needed, or fallback)
ALTER TABLE public.inquiries 
ADD COLUMN IF NOT EXISTS package_type TEXT;

-- 4. Comment/Documentation
COMMENT ON COLUMN public.inquiries.packages IS 'Array of package details: [{weight, dimension, type, commodity}]';
