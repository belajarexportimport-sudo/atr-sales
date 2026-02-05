import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, formatCurrency } from '../lib/utils';

import { useToast } from '../contexts/ToastContext';
import { useModal } from '../contexts/ModalContext';
import { inquiryService } from '../services/inquiryService';

export default function OperationsPage({ onViewInquiry }) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { showConfirm } = useModal();
    const [formData, setFormData] = useState({
        awb_number: '',
        status: 'In Transit',
        location: 'Jakarta Gateway',
        description: 'Shipment received at facility',
        occurred_at: new Date().toISOString().slice(0, 16) // yyyy-MM-ddThh:mm
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [pendingCommissions, setPendingCommissions] = useState([]);
    const [loadingCommissions, setLoadingCommissions] = useState(true);
    const [pendingQuotes, setPendingQuotes] = useState([]); // NEW
    const [loadingQuotes, setLoadingQuotes] = useState(true); // NEW
    const [userInitials, setUserInitials] = useState({});

    // Fetch pending AWB requests and users on mount
    useEffect(() => {
        fetchPendingRequests();
        fetchPendingUsers();
        fetchPendingCommissions();
        fetchPendingQuotes(); // NEW
    }, []);

    // Helper: Fetch Full Inquiry Details and Open View
    const handleViewDetails = async (inquiryId) => {
        try {
            setLoading(true);
            const fullInquiry = await inquiryService.getById(inquiryId);
            if (fullInquiry && onViewInquiry) {
                onViewInquiry(fullInquiry);
            } else {
                showToast('Failed to load details or View handler missing', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Error loading details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const payload = {
            ...formData,
            awb_number: formData.awb_number.trim(), // Ensure no spaces
            is_manual: true,
            occurred_at: new Date(formData.occurred_at).toISOString(),
            created_by: user?.id
        };

        console.log('Ops Page - Submitting Payload:', payload);

        try {
            const { data, error } = await supabase
                .from('tracking_events')
                .insert([payload])
                .select();

            console.log('Ops Page - Insert Result:', data, error);

            if (error) {
                alert(`Error Saving Data: ${error.message} (${error.code})`);
                throw error;
            }

            setMessage({ type: 'success', text: 'Tracking event updated successfully!' });

            // --- SYNC TO GOOGLE SHEET (LEGACY) ---
            try {
                // Hardcoded URL from your legacy file
                const GAS_URL = 'https://script.google.com/macros/s/AKfycbxGWqAOKQTuBnFtCjEq5CczzqcjS1mKjuM26VqYA0c8ioaZFmtj4JgwpfTZ3s3tNHoX/exec';

                const gasPayload = new URLSearchParams({
                    action: 'update',
                    awb: payload.awb_number,
                    status: payload.status,
                    location: payload.location,
                    description: payload.description,
                    timestamp: payload.occurred_at
                });

                // Fire and forget (don't await strictly to avoid UI lag, but log result)
                fetch(GAS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: gasPayload.toString()
                }).then(res => res.json()).then(resData => {
                    console.log('GSheet Sync Result:', resData);
                }).catch(err => {
                    console.error('GSheet Sync Failed:', err);
                });

            } catch (err) {
                console.warn('Skipping GSheet sync due to error:', err);
            }

            // Reset description only
            setFormData(prev => ({ ...prev, description: '' }));
        } catch (error) {
            console.error('Error updating tracking:', error);
            setMessage({ type: 'error', text: 'Failed to update tracking. Check permissions.' });
            showToast('❌ Failed to update tracking', 'error', error.message || error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch pending AWB requests
    const fetchPendingRequests = async () => {
        try {
            setLoadingRequests(true);
            const { data, error } = await supabase.rpc('get_pending_awb_requests');

            if (error) throw error;
            setPendingRequests(data || []);
        } catch (error) {
            console.error('Error fetching pending requests:', error);
        } finally {
            setLoadingRequests(false);
        }
    };

    // Approve AWB request
    const handleApproveAWB = (requestId, customerName) => {
        showConfirm('Approve AWB?', `Generate AWB for ${customerName}?`, async () => {
            try {
                setLoading(true);
                const { data: awbNumber, error } = await supabase.rpc('approve_awb_request', {
                    p_request_id: requestId,
                    p_approved_by: user.id
                });
                if (error) throw error;
                showToast(`✅ AWB Generated: ${awbNumber}`, 'success');
                fetchPendingRequests();

                // --- SYNC TO GOOGLE SHEET (AUTO) ---
                // --- SYNC TO GOOGLE SHEET (AUTO) ---
                try {
                    showToast('⏳ Syncing to Google Sheet...', 'info'); // UI Feedback
                    const GAS_URL = 'https://script.google.com/macros/s/AKfycbxGWqAOKQTuBnFtCjEq5CczzqcjS1mKjuM26VqYA0c8ioaZFmtj4JgwpfTZ3s3tNHoX/exec';
                    const gasPayload = new URLSearchParams({
                        action: 'update',
                        awb: awbNumber,
                        status: 'Picked Up',
                        location: 'Jakarta Gateway',
                        description: 'Shipment created and AWB generated',
                        timestamp: new Date().toISOString()
                    });

                    // Use no-cors to bypass CORS restrictions (Opaque response)
                    await fetch(GAS_URL, {
                        method: 'POST',
                        mode: 'no-cors', // Critical for client-side GAS calls
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: gasPayload.toString()
                    });

                    showToast('✅ Synced to GSheet!', 'success');

                } catch (e) {
                    console.error('GSheet Auto-Sync Error:', e);
                    showToast('⚠️ GSheet Sync skipped (Network)', 'error');
                }

            } catch (error) {
                console.error('Error approving AWB:', error);
                showToast(`❌ Failed: ${error.message}`, 'error');
            } finally {
                setLoading(false);
            }
        });
    };

    // Fetch pending users
    const fetchPendingUsers = async () => {
        try {
            setLoadingUsers(true);
            const { data, error } = await supabase.rpc('get_pending_users');
            if (error) throw error;
            setPendingUsers(data || []);
        } catch (error) {
            console.error('Error fetching pending users:', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    // Approve user
    const handleApproveUser = (userId, email) => {
        const initials = userInitials[userId];

        if (!initials || initials.length !== 2) {
            showToast('Please enter 2-letter initials (e.g., AD, RF)', 'error');
            return;
        }

        showConfirm('Approve User?', `Approve ${email} with initials ${initials}?`, async () => {
            try {
                setLoading(true);
                const { error } = await supabase.rpc('approve_user', {
                    p_user_id: userId,
                    p_initials: initials.toUpperCase(),
                    p_approved_by: user.id
                });

                if (error) throw error;
                showToast(`✅ User ${email} approved!`, 'success');
                fetchPendingUsers();
                setUserInitials(prev => {
                    const updated = { ...prev };
                    delete updated[userId];
                    return updated;
                });
            } catch (error) {
                console.error('Error approving user:', error);
                showToast(`❌ Failed: ${error.message}`, 'error');
            } finally {
                setLoading(false);
            }
        });
    };

    // Reject user
    const handleRejectUser = (userId, email) => {
        showConfirm('Reject User?', `Reject and delete ${email}? Cannot be undone.`, async () => {
            try {
                setLoading(true);
                const { error } = await supabase.rpc('reject_user', {
                    p_user_id: userId
                });
                if (error) throw error;
                showToast(`User ${email} rejected.`, 'info');
                fetchPendingUsers();
            } catch (error) {
                console.error('Error rejecting user:', error);
                showToast(`❌ Failed: ${error.message}`, 'error');
            } finally {
                setLoading(false);
            }
        }, 'error'); // Red button for reject
    };



    // Fetch pending commissions
    const fetchPendingCommissions = async () => {
        try {
            setLoadingCommissions(true);
            const { data, error } = await supabase.rpc('get_pending_commissions');

            if (error) throw error;
            setPendingCommissions(data || []);
        } catch (error) {
            console.error('Error fetching pending commissions:', error);
        } finally {
            setLoadingCommissions(false);
        }
    };

    // Handle Commission Change
    const handleCommissionChange = (inquiryId, newAmount) => {
        setPendingCommissions(prev => prev.map(comm =>
            comm.inquiry_id === inquiryId
                ? { ...comm, est_commission: newAmount }
                : comm
        ));
    };

    // Approve Commission
    const handleApproveCommission = (inquiryId, salesName, amount) => {
        showConfirm('Approve Commission?', `Approve ${formatCurrency(amount)} for ${salesName}?`, async () => {
            try {
                setLoading(true);
                const { error } = await supabase.rpc('approve_commission', {
                    p_inquiry_id: inquiryId,
                    p_approved_by: user.id,
                    p_commission_amount: parseFloat(amount)
                });
                if (error) throw error;
                showToast('✅ Commission Approved!', 'success');
                fetchPendingCommissions();
            } catch (error) {
                console.error('Error approving commission:', error);
                showToast(`❌ Failed: ${error.message}`, 'error');
            } finally {
                setLoading(false);
            }
        });
    };

    // Fetch pending quotes
    const fetchPendingQuotes = async () => {
        try {
            setLoadingQuotes(true);
            const { data, error } = await supabase.rpc('get_pending_quotes');
            if (error) throw error;
            setPendingQuotes(data || []);
        } catch (error) {
            console.error('Error fetching quotes:', error);
        } finally {
            setLoadingQuotes(false);
        }
    };

    // Approve Quote
    const handleApproveQuote = (inquiryId, customerName, revenue, gp) => {
        // Validate
        if (!revenue || revenue <= 0) {
            showToast('⚠️ Please enter valid Revenue before approving', 'error');
            return;
        }

        showConfirm('Approve Quote?', `Approve ${formatCurrency(revenue)} for ${customerName}?`, async () => {
            try {
                setLoading(true);
                const { error } = await supabase.rpc('approve_quote', {
                    p_inquiry_id: inquiryId,
                    p_approved_by: user.id,
                    p_revenue: parseFloat(revenue),
                    p_gp: parseFloat(gp || 0)
                });
                if (error) throw error;
                showToast('✅ Quotation Approved & Updated!', 'success');
                fetchPendingQuotes();
            } catch (error) {
                console.error('Error approving quote:', error);
                showToast(`❌ Failed: ${error.message}`, 'error');
            } finally {
                setLoading(false);
            }
        });
    };

    // Reject Quote
    const handleRejectQuote = (inquiryId, customerName) => {
        showConfirm('Reject Quote?', `Reject quotation for ${customerName}?`, async () => {
            try {
                setLoading(true);
                const { error } = await supabase.rpc('reject_quote', { p_inquiry_id: inquiryId });
                if (error) throw error;
                showToast('⚠️ Quotation Rejected', 'info');
                fetchPendingQuotes();
            } catch (error) {
                console.error('Error rejecting quote:', error);
                showToast(`❌ Failed: ${error.message}`, 'error');
            } finally {
                setLoading(false);
            }
        }, 'error');
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-100">Operations Dashboard</h1>
                <p className="text-gray-400">User Approvals, AWB Approvals & Shipment Status Updates</p>
            </header>

            {/* Pending User Approvals Section */}
            <div className="card mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-200">👤 Pending User Approvals</h2>

                {loadingUsers ? (
                    <p className="text-gray-500">Loading users...</p>
                ) : pendingUsers.length === 0 ? (
                    <p className="text-gray-500">No pending user approvals</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-secondary-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Registered</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Initials</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {pendingUsers.map((usr) => (
                                    <tr key={usr.user_id} className="hover:bg-secondary-700/50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-200">{usr.email}</td>
                                        <td className="px-4 py-3 text-sm text-gray-200">{usr.full_name || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-400">{formatDate(usr.created_at)}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <input
                                                type="text"
                                                maxLength={2}
                                                placeholder="AD"
                                                value={userInitials[usr.user_id] || ''}
                                                onChange={(e) => setUserInitials(prev => ({
                                                    ...prev,
                                                    [usr.user_id]: e.target.value.toUpperCase()
                                                }))}
                                                className="w-16 px-2 py-1 bg-secondary-800 border border-gray-600 rounded text-center font-mono uppercase text-gray-200 focus:border-primary-500"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApproveUser(usr.user_id, usr.email)}
                                                    disabled={loading}
                                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-xs"
                                                >
                                                    ✅ Approve
                                                </button>
                                                <button
                                                    onClick={() => handleRejectUser(usr.user_id, usr.email)}
                                                    disabled={loading}
                                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-xs"
                                                >
                                                    ❌ Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pending Commission Approvals Section */}
            <div className="card mb-6 border-l-4 border-yellow-500 bg-secondary-800/80">
                <h2 className="text-xl font-semibold mb-4 text-gray-200">💰 Pending Commission Approvals</h2>

                {loadingCommissions ? (
                    <p className="text-gray-500">Loading commissions...</p>
                ) : pendingCommissions.length === 0 ? (
                    <p className="text-gray-500">No pending commission requests</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-secondary-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sales Rep</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Revenue (IDR)</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">GP (IDR)</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Comm (IDR)</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {pendingCommissions.map((comm) => (
                                    <tr key={comm.inquiry_id} className="hover:bg-secondary-700/50 transition-colors">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-200">{comm.sales_rep}</td>
                                        <td className="px-4 py-3 text-sm text-gray-400">{comm.customer_name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-400 font-mono">{formatCurrency(comm.est_revenue)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-400 font-mono">{formatCurrency(comm.est_gp)}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="flex flex-col gap-1">
                                                <input
                                                    type="number"
                                                    value={comm.est_commission}
                                                    onChange={(e) => handleCommissionChange(comm.inquiry_id, e.target.value)}
                                                    className="w-28 px-2 py-1 bg-secondary-900 border border-yellow-600 rounded text-right font-mono font-bold text-yellow-500 focus:ring-yellow-500 focus:border-yellow-500 text-xs"
                                                />
                                                <span className="text-[10px] text-gray-500">2% GP: {formatCurrency(comm.est_gp * 0.02)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(comm.created_at)}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <button
                                                onClick={() => handleViewDetails(comm.inquiry_id)}
                                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs shadow-sm"
                                                title="View Details"
                                            >
                                                🔍 View
                                            </button>
                                            <button
                                                onClick={() => handleApproveCommission(comm.inquiry_id, comm.sales_rep, comm.est_commission)}
                                                disabled={loading}
                                                className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 text-xs shadow-sm shadow-yellow-900/50"
                                            >
                                                ✓ Approve
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pending AWB Requests Section */}
            <div className="card mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-200">📦 Pending AWB Requests</h2>

                {loadingRequests ? (
                    <p className="text-gray-500">Loading requests...</p>
                ) : pendingRequests.length === 0 ? (
                    <p className="text-gray-500">No pending AWB requests</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-secondary-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sales</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Initial</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Requested</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {pendingRequests.map((req) => (
                                    <tr key={req.request_id} className="hover:bg-secondary-700/50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-200">{req.sales_name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-200">{req.customer_name}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className="px-2 py-1 bg-primary-900/50 text-primary-200 border border-primary-800 rounded font-mono text-xs">
                                                {req.sales_initial}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-400">{formatDate(req.requested_at)}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <button
                                                onClick={() => handleViewDetails(req.inquiry_id)}
                                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                                                title="View Details"
                                            >
                                                🔍
                                            </button>
                                            <button
                                                onClick={() => handleApproveAWB(req.request_id, req.customer_name)}
                                                disabled={loading}
                                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                            >
                                                ✅ Approve
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pending Quote Approvals Section */}
            <div className="card mb-6 border-l-4 border-blue-500 bg-secondary-800/80">
                <h2 className="text-xl font-semibold mb-4 text-gray-200">📜 Pending Quote Approvals</h2>

                {loadingQuotes ? (
                    <p className="text-gray-500">Loading quotes...</p>
                ) : pendingQuotes.length === 0 ? (
                    <p className="text-gray-500">No pending quote requests</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-secondary-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sales</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Revenue</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">GP</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Origin/Dest</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {pendingQuotes.map((q) => (
                                    <tr key={q.inquiry_id} className="hover:bg-secondary-700/50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-400">{formatDate(q.created_at)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-200">{q.sales_rep}</td>
                                        <td className="px-4 py-3 text-sm text-gray-200">{q.customer_name}</td>
                                        <td className="px-4 py-3 text-sm">
                                            {/* Editable Revenue */}
                                            <input
                                                type="number"
                                                className="w-24 bg-secondary-900 border border-gray-600 rounded px-2 py-1 text-right font-mono text-xs text-white"
                                                placeholder="Revenue"
                                                value={q.est_revenue || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setPendingQuotes(prev => prev.map(item =>
                                                        item.inquiry_id === q.inquiry_id ? { ...item, est_revenue: val } : item
                                                    ));
                                                }}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {/* Editable GP */}
                                            <input
                                                type="number"
                                                className="w-24 bg-secondary-900 border border-gray-600 rounded px-2 py-1 text-right font-mono text-xs text-green-400"
                                                placeholder="GP"
                                                value={q.est_gp || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setPendingQuotes(prev => prev.map(item =>
                                                        item.inquiry_id === q.inquiry_id ? { ...item, est_gp: val } : item
                                                    ));
                                                }}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{q.origin} → {q.destination}</td>
                                        <td className="px-4 py-3 text-sm flex gap-2">
                                            <button
                                                onClick={() => handleViewDetails(q.inquiry_id)}
                                                className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                                title="View Details"
                                            >
                                                🔍
                                            </button>
                                            <button
                                                onClick={() => handleApproveQuote(q.inquiry_id, q.customer_name, q.est_revenue, q.est_gp)}
                                                disabled={loading}
                                                className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs shadow-lg shadow-green-900/50"
                                            >
                                                ✓ Approve
                                            </button>
                                            <button
                                                onClick={() => handleRejectQuote(q.inquiry_id, q.customer_name)}
                                                disabled={loading}
                                                className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                                            >
                                                ✕ Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Manual Tracking Update Form */}
            <div className="card max-w-lg mx-auto">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label">AWB Number</label>
                        <input
                            type="text"
                            className="input-field uppercase"
                            placeholder="ATR-XXXXXXXX"
                            value={formData.awb_number}
                            onChange={(e) => setFormData({ ...formData, awb_number: e.target.value.toUpperCase() })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Status</label>
                            <select
                                className="input-field"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option>Picked Up</option>
                                <option>In Transit</option>
                                <option>Arrived at Facility</option>
                                <option>Out for Delivery</option>
                                <option>Delivered</option>
                                <option>Exception</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Timestamp</label>
                            <input
                                type="datetime-local"
                                className="input-field"
                                value={formData.occurred_at}
                                onChange={(e) => setFormData({ ...formData, occurred_at: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">Location</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="e.g. Cengkareng Hub"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="label">Description / Note</label>
                        <textarea
                            className="input-field"
                            rows="2"
                            placeholder="Additional details..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                    </div>

                    {message && (
                        <div className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary w-full"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : '💾 Save Status Update'}
                    </button>
                </form>
            </div>
        </div>
    );
}
