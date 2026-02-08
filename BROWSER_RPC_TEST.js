// BROWSER CONSOLE TEST - Copy paste ini ke console saat di dashboard

// Test 1: Check if AdminQuickEdit code updated
console.log('Testing AdminQuickEdit fix...');

// Test 2: Manually call RPC to verify it works
const testRPC = async () => {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(
        'https://ewquycutqbtagjlokvyn.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3cXV5Y3V0cWJ0YWdqbG9rdnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5NTY0MjQsImV4cCI6MjA1MzUzMjQyNH0.VYqxOxQrqPqLPqxQrqPqLPqxQrqPqLPqxQrqPqLPqxQ'
    );

    // Get latest inquiry ID
    const { data: inquiries } = await supabase
        .from('inquiries')
        .select('id, customer_name, est_revenue')
        .order('created_at', { ascending: false })
        .limit(1);

    if (!inquiries || inquiries.length === 0) {
        console.log('No inquiries found');
        return;
    }

    const inquiry = inquiries[0];
    console.log('Testing with inquiry:', inquiry);

    // Call RPC to update revenue
    const { data, error } = await supabase.rpc('admin_update_inquiry_financials', {
        p_inquiry_id: inquiry.id,
        p_revenue: 888888,
        p_gp: 666666,
        p_commission: 13333,
        p_awb: 'TEST-AWB-123'
    });

    if (error) {
        console.error('❌ RPC Error:', error);
    } else {
        console.log('✅ RPC Success:', data);
        console.log('Revenue updated to:', data.est_revenue);
    }
};

// Run test
testRPC();
