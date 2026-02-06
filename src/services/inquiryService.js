import { supabase } from '../lib/supabase';

// Helper to handle Supabase errors standardly
const handleError = (error, context) => {
    if (error) {
        console.error(`Error in ${context}:`, error);
        throw error;
    }
};

export const inquiryService = {
    /**
     * Fetch inquiries for dashboard with filters
     * @param {string} role - 'admin' or 'sales'
     * @param {string} userId - Current user ID
     * @param {string|null} filterSalesId - For admin filtering
     */
    async getDashboardData(role, userId, filterSalesId = 'all') {
        let query = supabase
            .from('inquiries')
            .select('*')
            .order('created_at', { ascending: false });

        // Admin Filter Logic
        if (role === 'admin') {
            if (filterSalesId !== 'all') {
                query = query.eq('user_id', filterSalesId);
            }
        } else {
            // Sales logic: strictly own data
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;
        handleError(error, 'getDashboardData');
        return data || [];
    },

    /**
     * Get single inquiry by ID
     */
    async getById(id) {
        const { data, error } = await supabase
            .from('inquiries')
            .select('*')
            .eq('id', id)
            .single();

        handleError(error, 'getById');
        return data;
    },

    /**
     * Create new inquiry
     */
    /**
     * Create new inquiry
     */
    async create(inquiryData, userRole) {
        const { data, error } = await supabase
            .from('inquiries')
            .insert([inquiryData])
            .select()
            .single();

        handleError(error, 'createInquiry');

        // [FIX] Force update financials via RPC for Admin (Bypass INSERT RLS limitations)
        if (data && userRole === 'admin' && (inquiryData.est_revenue || inquiryData.est_gp)) {
            console.log('🚀 [CREATE] Using Admin RPC Tunnel for Financials');
            const { error: rpcError } = await supabase.rpc('admin_update_financials', {
                p_inquiry_id: data.id,
                p_revenue: parseFloat(inquiryData.est_revenue || 0),
                p_gp: parseFloat(inquiryData.est_gp || 0),
                p_commission: parseFloat(inquiryData.est_commission || 0)
            });

            if (rpcError) console.error('❌ RPC Create-Update Failed:', rpcError);
        }

        return data;
    },

    /**
     * Update existing inquiry with safety checks
     * Prevents overwriting 'user_id' (Data Stealing) and 'commission' (if not admin)
     */
    async update(id, updates, userRole) {
        // SAFETY 1: Never allow changing owner via update (Unless Admin/Null logic controlled by Caller, but here we enforce strictness)
        // CHECK: If admin wants to release to pool, they set user_id to null.
        // We only allow user_id change if role is admin.
        const cleanUpdates = { ...updates };

        // DEBUG: Check why RPC Tunnel might be skipped
        console.log('🔍 UPDATE DEBUG:', {
            id,
            userRole,
            hasRevenue: cleanUpdates.est_revenue !== undefined,
            revenueValue: cleanUpdates.est_revenue,
            fullUpdates: cleanUpdates
        });

        if (userRole !== 'admin') {
            delete cleanUpdates.user_id;
            // SAFETY 2: Protect commission if not admin
            delete cleanUpdates.est_commission;
            delete cleanUpdates.commission_approved;
            delete cleanUpdates.commission_amount;
        }

        // [FIX] Force update financials via RPC for Admin (Bypass RLS)
        let rpcSuccess = false;

        // CHECK: Only trigger if Admin AND (Revenue OR GP is being updated)
        if (userRole === 'admin' && (cleanUpdates.est_revenue !== undefined || cleanUpdates.est_gp !== undefined)) {
            const revVal = parseFloat(cleanUpdates.est_revenue || 0);
            const gpVal = parseFloat(cleanUpdates.est_gp || 0);

            // DEBUG ALERT REMOVED
            console.log('🚀 Using Admin RPC Tunnel for Financials');

            const { error: rpcError } = await supabase.rpc('admin_update_financials', {
                p_inquiry_id: id,
                p_revenue: revVal,
                p_gp: gpVal,
                p_commission: parseFloat(cleanUpdates.est_commission || 0)
            });

            if (rpcError) {
                console.error('❌ RPC Update Failed:', rpcError);
                throw rpcError;
            } else {
                console.log('✅ RPC Update Success');
                rpcSuccess = true;

                // Clear fields to prevent conflict with standard update
                delete cleanUpdates.est_revenue;
                delete cleanUpdates.est_gp;
                delete cleanUpdates.est_commission;
                delete cleanUpdates.commission_amount;
            }
        }

        // If nothing left to update (only financials changed), return success immediately
        if (Object.keys(cleanUpdates).length === 0 && rpcSuccess) {
            return { id, ...updates }; // Mock return
        }

        // Standard Update for remaining fields (Status, AWB, etc.)
        const { data, error } = await supabase
            .from('inquiries')
            .update(cleanUpdates)
            .eq('id', id)
            .select()
            .single();

        handleError(error, 'updateInquiry');
        return data;
    },

    /**
     * Delete inquiry
     */
    async delete(id) {
        const { error } = await supabase
            .from('inquiries')
            .delete()
            .eq('id', id);

        handleError(error, 'deleteInquiry');
        return true;
    },

    /**
     * Request AWB Number (RPC)
     */
    async requestAWB(inquiryId, userId, userInitials) {
        const { data, error } = await supabase.rpc('request_awb', {
            p_inquiry_id: inquiryId,
            p_sales_rep_id: userId,
            p_sales_initial: userInitials
        });

        handleError(error, 'requestAWB');
        return data;
    },

    /**
     * Get Pending AWB Requests (RPC)
     */
    async getPendingAWBRequests() {
        const { data, error } = await supabase.rpc('get_pending_awb_requests');
        if (error) {
            console.error('Error fetching pending AWB:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Get Open Inquiries (Unassigned)
     */
    async getOpenInquiries() {
        const { data, error } = await supabase
            .from('inquiries')
            .select('*')
            .is('user_id', null)
            .eq('status', 'UNASSIGNED')
            .order('created_at', { ascending: false });

        handleError(error, 'getOpenInquiries');
        return data || [];
    },

    /**
     * Grab an existing Lead (RPC)
     */
    async grabInquiry(inquiryId, userId) {
        const { data, error } = await supabase.rpc('grab_lead', {
            lead_id: inquiryId,
            grabber_id: userId
        });

        handleError(error, 'grabInquiry');
        return data; // returns true/false
    }
};
