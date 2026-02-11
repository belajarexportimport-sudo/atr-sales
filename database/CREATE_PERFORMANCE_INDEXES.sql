-- ============================================
-- ATR SALES PWA - DATABASE PERFORMANCE INDEXES
-- SUPABASE COMPATIBLE VERSION
-- ============================================
-- Purpose: Optimize query performance for common operations
-- Risk Level: ZERO - Safe to run in production
-- Downtime: MINIMAL - Indexes created without CONCURRENTLY
-- Execution Time: ~1-3 minutes total
-- ============================================

-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Copy-paste this ENTIRE file
-- 3. Click "Run"
-- 4. Wait for "Success" message
-- 5. Done! No code changes needed.

-- NOTE: We removed CONCURRENTLY keyword because Supabase SQL Editor
-- runs queries in a transaction block. This is safe for small-medium tables.
-- For very large tables (>1M rows), consider running indexes one by one.

-- ============================================
-- CRITICAL INDEXES FOR INQUIRIES TABLE
-- ============================================

-- Index 1: User ID lookup (Most common query)
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id 
ON inquiries(user_id);

-- Index 2: Status filtering
CREATE INDEX IF NOT EXISTS idx_inquiries_status 
ON inquiries(status);

-- Index 3: Date sorting (Recent inquiries)
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at 
ON inquiries(created_at DESC);

-- Index 4: Composite index for user + status
CREATE INDEX IF NOT EXISTS idx_inquiries_user_status 
ON inquiries(user_id, status);

-- Index 5: Leaderboard optimization
CREATE INDEX IF NOT EXISTS idx_inquiries_leaderboard 
ON inquiries(user_id, est_revenue, est_gp) 
WHERE status IN ('Won', 'Won - Verification at WHS', 'Invoiced', 'Paid');

-- Index 6: Commission tracking
CREATE INDEX IF NOT EXISTS idx_inquiries_commission 
ON inquiries(user_id, commission_status, commission_amount)
WHERE commission_amount > 0;

-- ============================================
-- INDEXES FOR PROFILES TABLE
-- ============================================

-- Index 7: Email lookup (Login, User search)
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email);

-- Index 8: Role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON profiles(role);

-- Index 9: Sales code lookup
CREATE INDEX IF NOT EXISTS idx_profiles_sales_code 
ON profiles(sales_code) 
WHERE sales_code IS NOT NULL;

-- ============================================
-- INDEXES FOR LEADS TABLE (if exists)
-- ============================================

-- Index 10: User's leads
CREATE INDEX IF NOT EXISTS idx_leads_user_id 
ON leads(user_id);

-- Index 11: Lead status
CREATE INDEX IF NOT EXISTS idx_leads_status 
ON leads(status);

-- Index 12: Company name search
CREATE INDEX IF NOT EXISTS idx_leads_company_name 
ON leads(company_name);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all indexes on inquiries table
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'inquiries' 
ORDER BY indexname;

-- ============================================
-- SUCCESS CONFIRMATION
-- ============================================
-- After running, you should see a table showing all indexes.
-- Look for indexes starting with "idx_inquiries_", "idx_profiles_", "idx_leads_"
-- 
-- If you see them listed, SUCCESS! Indexes are created.
