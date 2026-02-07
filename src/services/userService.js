import { supabase } from '../lib/supabase';

const handleError = (error, context) => {
    if (error) {
        console.error(`Error in ${context}:`, error);
        throw error;
    }
};

export const userService = {
    /**
     * Fetch all sales representatives (profiles)
     * Used for Admin Dropdown & Filters
     */
    async getAllSalesReps() {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, sales_code');

        handleError(error, 'getAllSalesReps');
        return data || [];
    },

    /**
     * Get Pending Users (RPC)
     * For Admin Dashboard Todo List
     */
    async getPendingUsers() {
        const { data, error } = await supabase.rpc('get_pending_users');
        if (error) {
            console.error('Error fetching pending users:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Approve User
     * Used by: OperationsPage
     */
    async approveUser(userId, initials, approvedBy) {
        const { error } = await supabase.rpc('approve_user', {
            p_user_id: userId,
            p_initials: initials.toUpperCase(),
            p_approved_by: approvedBy
        });
        handleError(error, 'approveUser');
        return true;
    },

    /**
     * Reject User
     * Used by: OperationsPage
     */
    async rejectUser(userId) {
        const { error } = await supabase.rpc('reject_user', {
            p_user_id: userId
        });
        handleError(error, 'rejectUser');
        return true;
    }
};
