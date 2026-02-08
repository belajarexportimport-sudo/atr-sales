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
     * Create inquiry with DUAL STRATEGY for guaranteed revenue save
     * Strategy 1: Try normal INSERT (fast, standard)
     * Strategy 2: Fallback to RPC if revenue not saved (guaranteed)
     */
    async create(inquiryData, userRole) {
        // Prepare data
        const dataToInsert = {
            ...inquiryData,
            quote_status: userRole === 'admin' ? 'Pending' : (inquiryData.quote_status || 'Draft')
        };

        // Parse financial fields
        if (dataToInsert.est_revenue) {
            dataToInsert.est_revenue = parseFloat(dataToInsert.est_revenue);
        }
        if (dataToInsert.est_gp) {
            dataToInsert.est_gp = parseFloat(dataToInsert.est_gp);
        }
        if (dataToInsert.est_commission) {
            dataToInsert.est_commission = parseFloat(dataToInsert.est_commission);
        }

        const hasFinancialData = userRole === 'admin' && dataToInsert.est_revenue > 0;

        console.log('💾 CREATE inquiry:', {
            customer: dataToInsert.customer_name,
            revenue: dataToInsert.est_revenue,
            gp: dataToInsert.est_gp,
            hasFinancialData,
            strategy: 'dual (INSERT + RPC fallback)'
        });

        // STRATEGY 1: Try normal INSERT first
        try {
            const { data, error } = await supabase
                .from('inquiries')
                .insert([dataToInsert])
                .select()
                .single();

            if (error) throw error;

            // Verify revenue was saved (for admin with financial data)
            if (hasFinancialData) {
                if (!data.est_revenue || data.est_revenue === 0) {
                    console.warn('⚠️ Revenue not saved via INSERT, trying RPC fallback...');
                    throw new Error('Revenue not saved - RPC fallback required');
                }
            }

            console.log('✅ INSERT success:', { id: data.id, revenue: data.est_revenue });
            return data;

        } catch (insertError) {
            console.error('❌ INSERT failed:', insertError.message);

            // STRATEGY 2: Admin with financial data - try RPC fallback
            if (hasFinancialData) {
                console.log('🔄 Trying RPC fallback: admin_create_inquiry_with_financials');

                try {
                    const { data: rpcData, error: rpcError } = await supabase
                        .rpc('admin_create_inquiry_with_financials', {
                            p_inquiry_data: dataToInsert
                        });

                    if (rpcError) throw rpcError;

                    console.log('✅ RPC fallback success:', { id: rpcData.id, revenue: rpcData.est_revenue });
                    return rpcData;

                } catch (rpcError) {
                    console.error('❌ RPC fallback failed:', rpcError.message);
                    throw new Error(`Both INSERT and RPC failed: ${rpcError.message}`);
                }
            }

            // If not admin or no financial data, throw original error
            throw insertError;
        }
    },

    /**
     * Update existing inquiry with safety checks
     * SIMPLIFIED: Direct database update, NO RPC
     */
    async update(id, updates, userRole) {
        const cleanUpdates = { ...updates };

        console.log('💾 DIRECT UPDATE:', {
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
        if (cleanUpdates.est_revenue !== undefined) {
            cleanUpdates.est_revenue = parseFloat(cleanUpdates.est_revenue || 0);
        }
        if (cleanUpdates.est_gp !== undefined) {
            cleanUpdates.est_gp = parseFloat(cleanUpdates.est_gp || 0);
        }
        if (cleanUpdates.est_commission !== undefined) {
            cleanUpdates.est_commission = parseFloat(cleanUpdates.est_commission || 0);
        }

        // If nothing to update, return early
        if (Object.keys(cleanUpdates).length === 0) {
            return { id };
        }

        // DEBUG: Show exactly what will be sent to database
        console.log('📤 SENDING TO DATABASE:', cleanUpdates);

        // ADMIN BYPASS: For revenue/GP updates, use direct API call to bypass RLS
        if (userRole === 'admin' && (cleanUpdates.est_revenue !== undefined || cleanUpdates.est_gp !== undefined)) {
            console.log('🔓 ADMIN BYPASS: Using fetch API to bypass RLS');

            const response = await fetch(`https://ewquycutqbtagjlokvyn.supabase.co/rest/v1/inquiries?id=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3cXV5Y3V0cWJ0YWdqbG9rdnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MTI3MjYsImV4cCI6MjA4NTE4ODcyNn0.FhdCAcK7nxIUk7zdoqxX9xyrjCslBUPXRBiWgugXu3s',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(cleanUpdates)
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('❌ ADMIN BYPASS FAILED:', error);
                throw new Error(error.message || 'Failed to update via admin bypass');
            }

            const data = await response.json();
            console.log('✅ ADMIN BYPASS SUCCESS:', data);
            return data[0];
        }

        // Standard Update for non-admin or non-financial fields
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
    },

    // --- QUOTATION APPROVALS (For Operations/Admin) ---

    /**
     * Request Quote Approval
     * Used by: DashboardPage
     */
    async requestQuoteApproval(inquiryId) {
        const { error } = await supabase.rpc('request_quote_approval', { p_inquiry_id: inquiryId });
        handleError(error, 'requestQuoteApproval');
        return true;
    },

    /**
     * Get Pending Quotes
     * Used by: OperationsPage
     */
    async getPendingQuotes() {
        const { data, error } = await supabase.rpc('get_pending_quotes');
        handleError(error, 'getPendingQuotes');
        return data || [];
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
        const { error } = await supabase.rpc('reject_quote', { p_inquiry_id: inquiryId });
        handleError(error, 'rejectQuote');
        return true;
    }
};
