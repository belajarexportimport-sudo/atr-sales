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
            .order('updated_at', { ascending: false });

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
     * Search inquiries by ID or Customer Name (Admin Feature)
     * @param {string} query - Search term
     */
    async searchInquiries(query) {
        if (!query) return [];

        let searchTerm = query.trim().replace(/^Q-/i, '').toLowerCase();

        // CLIENT-SIDE FILTERING STRATEGY
        // UUIDs don't support partial match (ilike) easily.
        // We fetch the last 500 records and filter in JS.
        // This is safer and avoids 404/400 errors.

        const { data, error } = await supabase
            .from('inquiries')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(500);

        if (error) {
            handleError(error, 'searchInquiries');
            return [];
        }

        if (!data) return [];

        // Filter: ID contains search term OR Customer Name contains search term
        const filtered = data.filter(item => {
            const idMatch = item.id && item.id.toLowerCase().includes(searchTerm);
            const nameMatch = item.customer_name && item.customer_name.toLowerCase().includes(searchTerm);
            return idMatch || nameMatch;
        });

        return filtered.slice(0, 20);
    },

    /**
     * Update existing inquiry with safety checks
     * Consolidated to handle both admin and sales rep updates.
     */
    async update(id, updates, userRole) {
        const cleanUpdates = { ...updates };

        console.log('💾 UPDATING inquiry:', {
            id,
            userRole,
            revenue: cleanUpdates.est_revenue,
            gp: cleanUpdates.est_gp,
            commission: cleanUpdates.est_commission
        });

        // Safety: Non-admin cannot change ownership or commission
        if (userRole !== 'admin') {
            delete cleanUpdates.user_id;
            delete cleanUpdates.est_commission;
            delete cleanUpdates.commission_approved;
            delete cleanUpdates.commission_amount;
        }

        // Parse financial fields
        const financialFields = ['est_revenue', 'est_gp', 'est_commission', 'commission_amount'];
        financialFields.forEach(field => {
            if (cleanUpdates[field] !== undefined) {
                cleanUpdates[field] = parseFloat(cleanUpdates[field] || 0);
            }
        });

        // If nothing to update, return early
        if (Object.keys(cleanUpdates).length === 0) {
            return { id };
        }

        console.log('📤 SENDING TO DATABASE:', cleanUpdates);

        // Try standard update first
        const { data, error } = await supabase
            .from('inquiries')
            .update(cleanUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            // If RLS blocked it (common for admin updating sales data)
            if (error.code === '42501' && userRole === 'admin') {
                console.warn('⚠️ RLS blocked standard update. This usually means the Admin RLS policy is missing.');
            }
            handleError(error, 'updateInquiry');
        }

        return data;
    },

    /**
     * Create new inquiry (v4.7 Fix Deploy)
     */
    async create(data, userRole) {
        console.log('💾 CREATING inquiry:', data);

        const cleanData = { ...data };

        // Safety: Non-admin cannot set commission or approved status
        if (userRole !== 'admin') {
            delete cleanData.est_commission;
            delete cleanData.commission_approved;
            delete cleanData.commission_amount;
        }

        const { data: newInquiry, error } = await supabase
            .from('inquiries')
            .insert([cleanData])
            .select()
            .single();

        if (error) {
            handleError(error, 'createInquiry');
        }

        return newInquiry;
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
     * Shows all inquiries where user_id is NULL, regardless of status
     */
    async getOpenInquiries() {
        const { data, error } = await supabase
            .from('inquiries')
            .select('*')
            .is('user_id', null)
            .order('created_at', { ascending: false });

        handleError(error, 'getOpenInquiries');
        return data || [];
    },

    /**
     * Grab an existing Lead (RPC)
     */
    /**
     * Grab an existing Lead (DIRECT UPDATE)
     * Bypasses RPC to rely on "Sales can grab open leads" RLS Policy
     */
    async grabInquiry(inquiryId, userId) {
        console.log('🦈 Grabbing lead via DIRECT UPDATE:', { inquiryId, userId });

        const { data, error } = await supabase
            .from('inquiries')
            .update({
                user_id: userId,
                status: 'Profiling',
                updated_at: new Date().toISOString()
            })
            .eq('id', inquiryId)
            .is('user_id', null) // Safety: ensure it's still open
            .select()
            .single();

        if (error) {
            console.error('❌ Grab Failed:', error);
            handleError(error, 'grabInquiry');
        }

        console.log('✅ Grab Success:', data);
        return true;
    },

    // --- QUOTATION APPROVALS (For Operations/Admin) ---

    /**
     * Request Quote Approval
     * Used by: DashboardPage
     * FIXED: Direct UPDATE instead of broken RPC
     */
    async requestQuoteApproval(inquiryId) {
        console.log('📤 Requesting quote approval for:', inquiryId);

        const { error } = await supabase
            .from('inquiries')
            .update({
                quote_status: 'Pending'
            })
            .eq('id', inquiryId);

        if (error) {
            console.error('❌ Failed to request approval:', error);
            handleError(error, 'requestQuoteApproval');
        }

        console.log('✅ Quote approval requested');
        return true;
    },

    /**
     * Get Pending Quotes
     * Used by: OperationsPage
     * FIXED: Direct SELECT instead of broken RPC
     */
    async getPendingQuotes() {
        console.log('📋 Fetching pending quotes (Manual Join Mode)...');

        // 1. Fetch Inquiries ONLY (No Join to avoid 400 Error)
        const { data: inquiries, error } = await supabase
            .from('inquiries')
            .select('*')
            .eq('quote_status', 'Pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Failed to fetch pending quotes:', error);
            handleError(error, 'getPendingQuotes');
            return [];
        }

        // 2. Extract User IDs to fetch profiles manually
        const userIds = [...new Set(inquiries.map(item => item.user_id).filter(Boolean))];
        let profileMap = {};

        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', userIds);

            if (profiles) {
                profiles.forEach(p => {
                    profileMap[p.id] = p.full_name;
                });
            }
        }

        // 3. Map Value to match OperationsPage expectation
        const mappedData = inquiries.map(item => ({
            ...item,
            inquiry_id: item.id, // CRITICAL: OperationsPage uses inquiry_id
            sales_rep: profileMap[item.user_id] || 'Unknown',
            origin: item.origin_city || item.origin || '-',
            destination: item.destination_city || item.destination || '-'
        }));

        console.log('✅ Pending quotes:', mappedData?.length || 0);
        return mappedData;
    },

    /**
     * Approve Quote
     * Used by: OperationsPage
     * FIXED: Preserve user_id to prevent sales attribution loss
     */

    async approveQuote(inquiryId, approvedBy, revenue, gp) {
        console.log('🔧 APPROVE QUOTE:', { inquiryId, revenue, gp });

        // CRITICAL: Fetch inquiry first to get original user_id
        const { data: inquiry, error: fetchError } = await supabase
            .from('inquiries')
            .select('user_id, customer_name')
            .eq('id', inquiryId)
            .single();

        if (fetchError) {
            console.error('❌ Failed to fetch inquiry:', fetchError);
            throw fetchError;
        }

        console.log('🔍 Original inquiry user_id:', inquiry.user_id);

        // Update with user_id preservation
        const { error } = await supabase
            .from('inquiries')
            .update({
                quote_status: 'Approved',
                est_revenue: parseFloat(revenue),
                est_gp: parseFloat(gp || 0),
                est_commission: parseFloat(gp || 0) * 0.02,
                status: 'Proposal',
                commission_status: 'Pending',
                user_id: inquiry.user_id // 👈 CRITICAL: Preserve original owner
            })
            .eq('id', inquiryId);

        if (error) {
            console.error('❌ UPDATE error:', error);
            handleError(error, 'approveQuote');
        }

        console.log('✅ Quote approved - user_id preserved:', inquiry.user_id);
        return true;
    },

    /**
     * Reject Quote
     * Used by: OperationsPage
     */
    async rejectQuote(inquiryId) {
        // FIXED: Direct update instead of potentially missing RPC
        const { error } = await supabase
            .from('inquiries')
            .update({
                quote_status: 'Rejected',
                status: 'Lost', // Or keep current status? Usually rejected quote means deal lost or needs revision.
                // Optionally clear financial data? No, keep history.
            })
            .eq('id', inquiryId);

        handleError(error, 'rejectQuote');
        return true;
    }
};
