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
        // FIXED: Use direct select to allow filtering by 'role' (RPC doesn't return role)
        const { data, error } = await supabase
            .from('profiles')
            .select('id, email, full_name, created_at, role, approved')
            .eq('approved', false)
            .neq('role', 'rejected') // Exclude rejected users
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching pending users:', error);
            return [];
        }

        // Map to expected format if needed (OpsPage expects { user_id, ... })
        return data.map(u => ({
            user_id: u.id,
            email: u.email,
            full_name: u.full_name,
            created_at: u.created_at
        })) || [];
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
        // FIXED: Soft delete by setting role to 'rejected' and approved to false
        const { error } = await supabase
            .from('profiles')
            .update({
                approved: false,
                role: 'rejected'
            })
            .eq('id', userId);

        handleError(error, 'rejectUser');
        return true;
    }
};
