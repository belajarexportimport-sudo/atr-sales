import { supabase } from '../lib/supabase';

const handleError = (error, context) => {
    if (error) {
        console.error(`Error in ${context}:`, error);
        throw error;
    }
};

export const leadService = {
    /**
     * Find existing lead or create a new one
     * Logic extracted from InquiryFormPage
     */
    async findOrCreate(user, leadData) {
        // 1. Check existing
        if (leadData.email || leadData.phone) {
            const { data: existingLead } = await supabase
                .from('leads')
                .select('id')
                .eq('user_id', user.id)
                .or(`email.eq.${leadData.email || 'null'},phone.eq.${leadData.phone || 'null'}`)
                .maybeSingle();

            if (existingLead) return existingLead.id;
        }

        // 2. Create New
        console.log('Services: Creating new lead for:', leadData.customer_name);
        const { data: newLead, error } = await supabase
            .from('leads')
            .insert([{
                user_id: user.id,
                company_name: leadData.customer_name,
                pic_name: leadData.pic || null,
                phone: leadData.phone || null,
                email: leadData.email || null,
                industry: leadData.industry || null,
                status: 'Hot', // Auto-set
            }])
            .select()
            .single();

        handleError(error, 'findOrCreateLead');
        return newLead.id;
    },

    /**
     * Get total lead count
     */
    async getCount() {
        const { count, error } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;
        return count || 0;
    }
};
