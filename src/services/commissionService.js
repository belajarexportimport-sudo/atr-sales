import { supabase } from '../lib/supabase';
import { calculateCommission } from '../lib/utils'; // Re-use existing math utility

// Helper for errors
const handleError = (error, context) => {
    if (error) {
        console.error(`Error in ${context}:`, error);
        throw error;
    }
};

export const commissionService = {
    /**
     * Calculate commission based on Revenue and GP
     * Currently just wraps the utility, but allows for future complex logic
     * (e.g., fetching rules from DB) without changing UI code.
     */
    calculate(revenue, gp) {
        return calculateCommission(revenue, gp);
    },

    /**
     * Approve Commission (RPC Call)
     * Calls the robust 'approve_commission' function we fixed earlier.
     */
    async approve(inquiryId, userId, amount) {
        const { error } = await supabase.rpc('approve_commission', {
            p_inquiry_id: inquiryId,
            p_approved_by: userId,
            p_commission_amount: amount
        });

        handleError(error, 'approveCommission');
        return true;
    },

    /**
     * Get Pending Commissions (for Admin Dashboard)
     */
    async getPendingCount() {
        const { count, error } = await supabase
            .from('inquiries')
            .select('*', { count: 'exact', head: true })
            .eq('commission_status', 'Pending');

        if (error) console.error('Error fetching pending count:', error);
        return count || 0;
    },

    /**
     * Get Pending Commissions Data (RPC)
     * For Admin Todo List
     */
    async getPendingCommissionsList() {
        const { data, error } = await supabase.rpc('get_pending_commissions');
        if (error) {
            console.error('Error fetching pending commissions:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Get Payable Commissions (Logic Updated: No Approval Needed)
     * Fetches all WON deals where commission is not yet PAID.
     */
    async getApprovedCommissionsList() {
        try {
            const { data, error } = await supabase
                .from('inquiries')
                .select(`
                    id,
                    est_revenue, 
                    est_gp, 
                    created_at, 
                    customer_name,
                    user_id,
                    est_commission,
                    commission_amount
                `)
                // Logic: Deal is WON/DONE, and Commission is NOT PAID, and Value > 0
                .in('status', ['Won', 'Won - Verification at WHS', 'Invoiced', 'Paid'])
                .neq('commission_status', 'Paid')
                .gt('est_commission', 0)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching payable commissions:', error);
                return [];
            }

            // Return simplified data
            return (data || []).map(item => ({
                inquiry_id: item.id,
                sales_rep: 'Sales', // Simplified
                customer_name: item.customer_name,
                est_revenue: item.est_revenue,
                est_gp: item.est_gp,
                // Use est_commission as the main value since we skip the copy-to-commission_amount step
                est_commission: item.est_commission,
                created_at: item.created_at
            }));
        } catch (err) {
            console.error('Exception in getApprovedCommissionsList:', err);
            return [];
        }
    },

    /**
     * Mark Commission as Paid
     */
    async markAsPaid(inquiryId) {
        const { error } = await supabase
            .from('inquiries')
            .update({ commission_status: 'Paid' })
            .eq('id', inquiryId);

        handleError(error, 'markAsPaid');
        return true;
    }
};
