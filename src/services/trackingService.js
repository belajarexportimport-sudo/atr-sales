import { supabase } from '../lib/supabase';

const handleError = (error, context) => {
    if (error) {
        console.error(`Error in ${context}:`, error);
        throw error;
    }
};

export const trackingService = {
    /**
     * Get tracking history for an AWB
     * Used by: TrackingPage
     */
    async getHistory(awb) {
        const cleanAwb = awb.trim();
        const { data, error } = await supabase
            .from('tracking_events')
            .select('*')
            .eq('awb_number', cleanAwb)
            .order('occurred_at', { ascending: false });

        handleError(error, 'getHistory');
        return data || [];
    },

    /**
     * Create a new tracking event (Manual Entry)
     * Used by: OperationsPage
     */
    async createEvent(payload) {
        // Ensure payload has minimal required fields or let DB constraint fail
        const { data, error } = await supabase
            .from('tracking_events')
            .insert([payload])
            .select()
            .single();

        handleError(error, 'createTrackingEvent');
        return data;
    },

    /**
     * Get 5 most recent events (Debug)
     * Used by: TrackingPage (Debug Component)
     */
    async getRecentEventsDebug() {
        const { data, error } = await supabase
            .from('tracking_events')
            .select('*')
            .limit(5)
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching debug events:', error);
        return data || [];
    },

    /**
     * Get Pending AWB Requests
     * Used by: OperationsPage
     */
    async getPendingRequests() {
        const { data, error } = await supabase.rpc('get_pending_awb_requests');

        // RPC might fail if not exists, but we handle standard errors
        handleError(error, 'getPendingRequests');
        return data || [];
    },

    /**
     * Approve AWB Request (Generate AWB)
     * Used by: OperationsPage
     */
    async approveRequest(requestId, approvedBy) {
        const { data: awbNumber, error } = await supabase.rpc('approve_awb_request', {
            p_request_id: requestId,
            p_approved_by: approvedBy
        });

        handleError(error, 'approveAWBRequest');
        return awbNumber;
    }
};
