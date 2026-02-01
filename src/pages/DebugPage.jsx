import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
        const { data, error } = await supabase.rpc('get_pending_users');
        if (error) throw error;
        addLog(`Found ${data.length} pending users.`, 'info');
        console.table(data);
    };

    const testCommissionRPC = async () => {
        // This expects the RPC to accept 3 arguments.
        // If it fails, it means the user hasn't run 'fix-ambiguous-function.sql'
        addLog('Testing approve_commission signature...', 'info');

        // We pass a fake ID initially just to check if the function exists and accepts params
        // This might fail with "UUID invalid" which is GOOD (means function exists)
        // If it fails with "Find function... signature" it means MISSING.
        const fakeId = '00000000-0000-0000-0000-000000000000';

        try {
            const { error } = await supabase.rpc('approve_commission', {
                p_inquiry_id: fakeId,
                p_approved_by: user.id,
                p_commission_amount: 500000
            });

            if (error) {
                if (error.message.includes('UUID') || error.message.includes('violates foreign key')) {
                    addLog('✅ Function Signature verified (Arguments accepted).', 'success');
                } else {
                    throw error;
                }
            }
        } catch (err) {
            throw err;
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto bg-gray-900 min-h-screen text-gray-100 font-mono">
            <h1 className="text-2xl font-bold mb-4 text-yellow-400">🕵️‍♂️ System Diagnostic Tool</h1>

            <div className="bg-gray-800 p-4 rounded mb-6">
                <h2 className="font-bold border-b border-gray-600 pb-2 mb-2">User Status</h2>
                <p>User ID: {user?.id}</p>
                <p>Role: {profile?.role}</p>
                <p>Approved: {profile?.approved ? 'YES' : 'NO'}</p>
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
                    <button
                        onClick={() => runTest('Approve Commission RPC', testCommissionRPC)}
                        className="w-full bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded text-left"
                        disabled={loading}
                    >
                        ▶ Test 'approve_commission' (Signature)
                    </button>
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
