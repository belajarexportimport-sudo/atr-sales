-- ============================================
-- ATR SALES PWA - GSHEET INJECT PREPARATION
-- ============================================
-- 1. Alter inquiries table to allow NULL user_id (Shark Tank)
-- 2. Add metadata field to track injection source
-- ============================================

-- 1. Remove NOT NULL constraint from user_id
ALTER TABLE public.inquiries ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add source column for traceability
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS injection_source TEXT DEFAULT 'manual';

-- 3. Add expected columns for GSheet / Marketplace UI
-- Note: 'weight' and 'est_weight' are consolidated.
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS est_weight DECIMAL(10,2);
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS est_volume DECIMAL(10,2);

-- 4. Update existing data to 'manual' if null
UPDATE public.inquiries SET injection_source = 'manual' WHERE injection_source IS NULL;

-- 5. SUCCESS MESSAGE
SELECT 'GSheet Injection Schema Prepared Successfully!' as status;
