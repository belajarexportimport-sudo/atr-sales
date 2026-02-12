import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { userService } from '../../../services/userService';
import { commissionService } from '../../../services/commissionService';

export default function DebugPage() {
    const { user, profile } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    const addLog = (msg, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [`[${timestamp}] ${type.toUpperCase()}: ${msg}`, ...prev]);
    };

    const runTest = async (name, testFn) => {
        setLoading(true);
        addLog(`--- START TEST: ${name} ---`, 'info');
        try {
            await testFn();
            addLog(`✅ PASSED: ${name}`, 'success');
        } catch (err) {
            console.error(err);
            addLog(`❌ FAILED: ${name} - ${err.message}`, 'error');
            addLog(`💡 HINT: You might need to run the SQL script for this function.`, 'warning');
        } finally {
            setLoading(false);
        }
    };

    const checkPendingUsers = async () => {
        const data = await userService.getPendingUsers();
        addLog(`Found ${data.length} pending users.`, 'info');
        console.table(data);
    };

    const simulateFullCommissionFlow = async () => {
        const testId = `TEST-${Date.now()}`;
        let inquiryId = null;

        try {
            // 1. Create Test Inquiry
            addLog('STEP 1: Creating Test Inquiry...', 'info');
            const { data: newInquiry, error: createError } = await supabase // Access supabase via service or context if exported
                .from('inquiries')
                .insert({
                    user_id: user.id,
                    customer_name: `Simulation Customer ${testId}`,
                    origin: 'JKT',
                    destination: 'SBY',
                    service_type: 'Reguler',
                    est_weight: 10,
                    status: 'Quotation',
                    quote_status: 'Draft'
                })
                .select()
                .single();

            if (createError) throw createError;
            inquiryId = newInquiry.id;
            addLog(`✅ Inquiry Created: ${inquiryId}`, 'success');

            // 2. Request Approval
            addLog('STEP 2: Requesting Quote Approval...', 'info');
            const { error: reqError } = await supabase.rpc('request_quote_approval', { p_inquiry_id: inquiryId });
            if (reqError) throw reqError;
            addLog('✅ Quote Approval Requested', 'success');

            // 3. Approve Quote (sets status to Won, commission Pending)
            addLog('STEP 3: Approving Quote (Revenue: 1,000,000, GP: 200,000)...', 'info');
            // Mocking inquiryService.approveQuote call locally to avoid import issues or just import it
            // We need inquiryService here. It's not imported yet? wait it is.
            // Oh, wait, I need to make sure I import inquiryService in the top which I didn't see earlier? 
            // Ah, I see userService and commissionService imported. I need inquiryService too.
            // For now, I'll use RPC directly to be safe or update imports.
            // Actually, let's just use the RPCs directly for the test to verify backend logic.
            const { error: approveQuoteError } = await supabase.rpc('approve_quote', {
                p_inquiry_id: inquiryId,
                p_approved_by: user.id,
                p_revenue: 1000000,
                p_gp: 200000
            });
            if (approveQuoteError) throw approveQuoteError;
            addLog('✅ Quote Approved. Commission should be Pending.', 'success');

            // 4. Approve Commission (sets status to Approved)
            addLog('STEP 4: Approving Commission (4000)...', 'info');
            await commissionService.approve(inquiryId, user.id, 4000);
            addLog('✅ Commission Approved. Status: Approved (Unpaid)', 'success');

            // 5. Mark as Paid
            addLog('STEP 5: Marking as Paid...', 'info');
            await commissionService.markAsPaid(inquiryId);
            addLog('✅ Commission Marked as Paid!', 'success');

            addLog('🎉 SIMULATION COMPLETE! Please check Operations Dashboard to see if it appears/disappears correctly (you might need to refresh).', 'success');

            // Optional: Cleanup
            // await userService.supabase.from('inquiries').delete().eq('id', inquiryId);
            // addLog('🧹 Test Data Cleaned up', 'info');

        } catch (err) {
            addLog(`❌ SIMULATION FAILED: ${err.message}`, 'error');
            if (inquiryId) {
                addLog(`⚠️ Test Inquiry ID (for manual cleanup): ${inquiryId}`, 'warning');
            }
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto bg-gray-900 min-h-screen text-gray-100 font-mono">
            <h1 className="text-2xl font-bold mb-4 text-yellow-400">🕵️‍♂️ System Diagnostic Tool</h1>

            <div className="bg-gray-800 p-4 rounded mb-6">
                <h2 className="font-bold border-b border-gray-600 pb-2 mb-2">User Status</h2>
                <p>User ID: {user?.id}</p>
                <p>Role: {profile?.role}</p>
                <p className={profile?.approved ? 'text-green-400' : 'text-red-400'}>
                    Approved: {profile?.approved ? 'YES' : 'NO'}
                </p>
                <p className={profile?.initials ? 'text-green-400' : 'text-red-400'}>
                    Initials: {profile?.initials || 'MISSING (Required for AWB)'}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                    <h3 className="font-bold text-gray-400">1. Check Backend Functions</h3>
                    <button
                        onClick={() => runTest('Get Pending Users', checkPendingUsers)}
                        className="w-full bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded text-left"
                        disabled={loading}
                    >
                        ▶ Test 'get_pending_users'
                    </button>
                    {/* testCommissionRPC button removed - function was undefined */}
                    <button
                        onClick={() => runTest('Full Commission Flow Simulation', simulateFullCommissionFlow)}
                        className="w-full bg-green-700 hover:bg-green-600 px-4 py-2 rounded text-left mt-2 border border-green-500"
                        disabled={loading}
                    >
                        🧪 SIMULATE: Quote to Pay Flow
                    </button>

                    <div className="mt-4 pt-4 border-t border-gray-700">
                        <label className="text-sm text-gray-400 block mb-1">Inspect Inquiry ID:</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Paste UUID..."
                                className="flex-1 bg-gray-700 rounded px-3 py-2 text-sm text-white border border-gray-600 focus:border-blue-500 outline-none"
                                id="inspectId"
                            />
                            <button
                                onClick={() => {
                                    const id = document.getElementById('inspectId').value.trim();
                                    if (!id) return alert('Enter a valid UUID');
                                    runTest(`Inspect Inquiry: ${id}`, async () => {
                                        const { data, error } = await supabase
                                            .from('inquiries')
                                            .select('*')
                                            .eq('id', id)
                                            .single();

                                        if (error) throw error;
                                        addLog(`🔎 Data for ${id}:`, 'info');
                                        addLog(`Revenue: ${new Intl.NumberFormat('id-ID').format(data.est_revenue || 0)}`, data.est_revenue > 0 ? 'success' : 'error');
                                        addLog(`GP: ${new Intl.NumberFormat('id-ID').format(data.est_gp || 0)}`, data.est_gp > 0 ? 'success' : 'error');
                                        addLog(`Status: ${data.status} | Quote: ${data.quote_status} | Comm: ${data.commission_status}`, 'warning');
                                        console.log('Full Inquiry Data:', data);
                                    });
                                }}
                                className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded text-white"
                                disabled={loading}
                            >
                                🔍
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-700">
                        <h4 className="text-sm font-bold text-yellow-400 mb-2">🔧 Fix Blank Revenue (Legacy Data)</h4>
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="Inquiry ID (UUID)"
                                className="w-full bg-gray-700 rounded px-3 py-2 text-sm text-white border border-gray-600 focus:border-blue-500 outline-none"
                                id="fixRevenueId"
                            />
                            <input
                                type="number"
                                placeholder="Revenue (e.g. 3900000)"
                                className="w-full bg-gray-700 rounded px-3 py-2 text-sm text-white border border-gray-600 focus:border-blue-500 outline-none"
                                id="fixRevenueAmount"
                            />
                            <input
                                type="number"
                                placeholder="GP (e.g. 800000)"
                                className="w-full bg-gray-700 rounded px-3 py-2 text-sm text-white border border-gray-600 focus:border-blue-500 outline-none"
                                id="fixGPAmount"
                            />
                            <button
                                onClick={async () => {
                                    const id = document.getElementById('fixRevenueId').value.trim();
                                    const revenue = parseFloat(document.getElementById('fixRevenueAmount').value);
                                    const gp = parseFloat(document.getElementById('fixGPAmount').value);

                                    if (!id || !revenue || !gp) {
                                        return alert('Please fill all fields!');
                                    }

                                    setLoading(true);
                                    addLog(`🔧 Fixing Revenue for ${id}...`, 'info');

                                    try {
                                        const { error } = await supabase
                                            .from('inquiries')
                                            .update({
                                                est_revenue: revenue,
                                                est_gp: gp,
                                                est_commission: gp * 0.02 // Auto-calculate 2% of GP
                                            })
                                            .eq('id', id);

                                        if (error) throw error;

                                        addLog(`✅ Updated! Revenue: ${new Intl.NumberFormat('id-ID').format(revenue)}, GP: ${new Intl.NumberFormat('id-ID').format(gp)}`, 'success');
                                        addLog(`💰 Commission auto-calculated: ${new Intl.NumberFormat('id-ID').format(gp * 0.02)}`, 'success');

                                        // Clear inputs
                                        document.getElementById('fixRevenueId').value = '';
                                        document.getElementById('fixRevenueAmount').value = '';
                                        document.getElementById('fixGPAmount').value = '';
                                    } catch (err) {
                                        addLog(`❌ Failed: ${err.message}`, 'error');
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                className="w-full bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded text-white font-bold"
                                disabled={loading}
                            >
                                💾 UPDATE REVENUE & GP
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="font-bold text-gray-400">2. Other Tests</h3>
                    {/* Placeholder for future tests */}
                    <p className="text-gray-600 text-sm">More diagnostic tools coming soon...</p>
                </div>
            </div>

            <div className="bg-black p-4 rounded h-96 overflow-y-auto border border-gray-700">
                <h3 className="text-gray-500 text-xs mb-2 sticky top-0 bg-black pb-2 border-b border-gray-800">DIAGNOSTIC LOGS</h3>
                {logs.length === 0 && <p className="text-gray-600 italic">Ready to test...</p>}
                {logs.map((log, i) => (
                    <div key={i} className={`mb-1 text-sm break-all ${log.includes('SUCCESS') || log.includes('PASSED') ? 'text-green-400' :
                        log.includes('FAILED') ? 'text-red-400' :
                            log.includes('WARNING') || log.includes('HINT') ? 'text-yellow-400' :
                                'text-gray-300'
                        }`}>
                        {log}
                    </div>
                ))}
            </div>
        </div>
    );
}
