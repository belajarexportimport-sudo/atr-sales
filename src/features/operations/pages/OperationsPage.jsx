import { useState, useEffect } from 'react';
// import { supabase } from '../../../lib/supabase'; // REMOVED: Using services
import { useAuth } from '../../../contexts/AuthContext';
import { formatDate, formatCurrency } from '../../../lib/utils';

import { useToast } from '../../../contexts/ToastContext';
import { useModal } from '../../../contexts/ModalContext';
import { inquiryService } from '../../../services/inquiryService';
import { trackingService } from '../../../services/trackingService';
import { userService } from '../../../services/userService';
import { commissionService } from '../../../services/commissionService';

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
    const [approvedCommissions, setApprovedCommissions] = useState([]); // NEW
    const [loadingApproved, setLoadingApproved] = useState(true); // NEW
    const [pendingQuotes, setPendingQuotes] = useState([]);
    const [loadingQuotes, setLoadingQuotes] = useState(true); // NEW
    const [userInitials, setUserInitials] = useState({});

    // Fetch pending AWB requests and users on mount
    useEffect(() => {
        fetchPendingRequests();
        fetchPendingUsers();
        fetchPendingCommissions();
        fetchApprovedCommissions(); // NEW
        fetchPendingQuotes();
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
            // Service Call
            const data = await trackingService.createEvent(payload);

            console.log('Ops Page - Insert Result:', data);

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
            const data = await trackingService.getPendingRequests();
            setPendingRequests(data);
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
                const awbNumber = await trackingService.approveRequest(requestId, user.id);
                showToast(`✅ AWB Generated: ${awbNumber}`, 'success');
                fetchPendingRequests();

                // --- SYNC TO GOOGLE SHEET ---
                console.log('✅ AWB approved. Database trigger will handle GSheet sync.');

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
            const data = await userService.getPendingUsers();
            setPendingUsers(data);
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
                await userService.approveUser(userId, initials, user.id);

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
                await userService.rejectUser(userId);
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
            const data = await commissionService.getPendingCommissionsList();
            setPendingCommissions(data);
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
                await commissionService.approve(inquiryId, user.id, parseFloat(amount));
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

    // Fetch approved commissions (ready to pay)
    const fetchApprovedCommissions = async () => {
        try {
            setLoadingApproved(true);
            const data = await commissionService.getApprovedCommissionsList();
            setApprovedCommissions(data);
        } catch (error) {
            console.error('Error fetching approved commissions:', error);
        } finally {
            setLoadingApproved(false);
        }
    };

    // Mark as Paid
    const handleMarkAsPaid = (inquiryId, salesName, amount) => {
        showConfirm('Mark as Paid?', `Confirm payment of ${formatCurrency(amount)} to ${salesName}?`, async () => {
            try {
                setLoading(true);
                await commissionService.markAsPaid(inquiryId);
                showToast('💰 Commission Marked as Paid!', 'success');
                fetchApprovedCommissions();
            } catch (error) {
                console.error('Error marking as paid:', error);
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
            const data = await inquiryService.getPendingQuotes();
            setPendingQuotes(data);
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
            showToast('⚠️ REVENUE KOSONG! Isi Revenue & GP di tabel dulu sebelum klik Approve', 'error');
            return;
        }
        if (!gp || gp <= 0) {
            showToast('⚠️ GP KOSONG! Isi GP di tabel dulu sebelum klik Approve', 'error');
            return;
        }

        showConfirm('Approve Quote?', `Confirm Revenue: ${formatCurrency(revenue)}\nGP: ${formatCurrency(gp)}\n\nProceed for ${customerName}?`, async () => {
            console.log('DEBUG: Approving Quote Payload:', {
                p_inquiry_id: inquiryId,
                p_approved_by: user.id,
                p_revenue: parseFloat(revenue),
                p_gp: parseFloat(gp || 0)
            });

            try {
                setLoading(true);
                await inquiryService.approveQuote(inquiryId, user.id, revenue, gp);
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

            {/* Pending Commission Approvals REMOVED (No longer needed) */}

            {/* Commissions Ready to Pay (Won & Unpaid) */}
            <div className="card mb-6 border-l-4 border-green-500 bg-secondary-800/80">
                <h2 className="text-xl font-semibold mb-4 text-gray-200">✅ Commissions Ready to Pay</h2>

                {loadingApproved ? (
                    <p className="text-gray-500">Loading approved commissions...</p>
                ) : approvedCommissions.length === 0 ? (
                    <p className="text-gray-500">No payable commissions found (Won & Unpaid)</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-secondary-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sales Rep</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Comm Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Approved Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {approvedCommissions.map((comm) => (
                                    <tr key={comm.inquiry_id} className="hover:bg-secondary-700/50 transition-colors">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-200">{comm.sales_rep}</td>
                                        <td className="px-4 py-3 text-sm text-gray-400">{comm.customer_name}</td>
                                        <td className="px-4 py-3 text-sm text-green-400 font-mono font-bold">{formatCurrency(comm.est_commission)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(comm.created_at)}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <button
                                                onClick={() => handleMarkAsPaid(comm.inquiry_id, comm.sales_rep, comm.est_commission)}
                                                disabled={loading}
                                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-xs shadow-sm shadow-green-900/50"
                                            >
                                                💸 Mark as Paid
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

            {/* Pending Quote Approvals REMOVED (No longer needed) */}

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
