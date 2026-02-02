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
            .select('id, full_name, email');

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
    }
};
