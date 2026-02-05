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
    async create(inquiryData) {
        const { data, error } = await supabase
            .from('inquiries')
            .insert([inquiryData])
            .select()
            .single();

        handleError(error, 'createInquiry');
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
        if (userRole !== 'admin') {
            delete cleanUpdates.user_id;
            // SAFETY 2: Protect commission if not admin
            delete cleanUpdates.est_commission;
            delete cleanUpdates.commission_approved;
            delete cleanUpdates.commission_amount;
        }

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
