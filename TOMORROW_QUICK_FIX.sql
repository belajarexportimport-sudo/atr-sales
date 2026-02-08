-- QUICK FIX FOR TOMORROW - Add this to AdminQuickEdit UPDATE

-- Current code in AdminQuickEdit.jsx (Line 49-55):
-- .update({
--     est_revenue: formData.revenue ? parseFloat(formData.revenue) : null,
--     est_gp: formData.gp ? parseFloat(formData.gp) : null,
--     est_commission: formData.commission ? parseFloat(formData.commission) : null,
--     awb_number: formData.awb || null,
--     updated_at: new Date().toISOString()
-- })

-- FIX: Add user_id to preserve original ownership
-- .update({
--     est_revenue: formData.revenue ? parseFloat(formData.revenue) : null,
--     est_gp: formData.gp ? parseFloat(formData.gp) : null,
--     est_commission: formData.commission ? parseFloat(formData.commission) : null,
--     awb_number: formData.awb || null,
--     user_id: inquiry.user_id,  // ← ADD THIS LINE TO PRESERVE OWNERSHIP
--     updated_at: new Date().toISOString()
-- })

-- This will explicitly set user_id to original value
-- preventing Supabase from overwriting it with current auth user
