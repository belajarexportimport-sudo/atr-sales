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
    }
};
