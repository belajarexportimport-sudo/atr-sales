-- Migration: Add detailed Shipper and Consignee columns to inquiries table
-- Description: Adds separate fields for Shipper and Consignee details (Name, Address, City, Zip, Phone, Email, PIC).
-- Author: ATR AI Assistant
-- Date: 2024-02-09

-- SHIPPER COLUMNS
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS shipper_name TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS shipper_address TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS shipper_city TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS shipper_province TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS shipper_postal_code TEXT; -- Ensure consistent naming with origin_postal_code logic if needed, or alias it
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS shipper_phone TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS shipper_email TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS shipper_pic TEXT;

-- CONSIGNEE COLUMNS
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS consignee_name TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS consignee_address TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS consignee_city TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS consignee_province TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS consignee_postal_code TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS consignee_phone TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS consignee_email TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS consignee_pic TEXT;

-- Comment on columns for documentation
COMMENT ON COLUMN inquiries.shipper_name IS 'Nama lengkap pengirim (Shipper)';
COMMENT ON COLUMN inquiries.consignee_name IS 'Nama lengkap penerima (Consignee) - Beda dengan Customer Billing';

-- Note: We already have origin_postal_code and destination_postal_code.
-- shipper_postal_code and consignee_postal_code might offer more granularity if the pickup/delivery address differs from the main origin/dest city code.
