import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../lib/utils';

export default function OperationsPage() {
    const { user } = useAuth();
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
    const [userInitials, setUserInitials] = useState({});

    // Fetch pending AWB requests and users on mount
    useEffect(() => {
        fetchPendingRequests();
        fetchPendingUsers();
    }, []);

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
    const handleApproveAWB = async (requestId, customerName) => {
        if (!confirm(`Approve AWB request for ${customerName}?`)) return;

        try {
            setLoading(true);
            const { data: awbNumber, error } = await supabase.rpc('approve_awb_request', {
                p_request_id: requestId,
                p_approved_by: user.id
            });

            if (error) throw error;

            alert(`✅ AWB Generated: ${awbNumber}`);
            fetchPendingRequests(); // Refresh list
        } catch (error) {
            console.error('Error approving AWB:', error);
            alert(`❌ Failed to approve AWB: ${error.message}`);
        } finally {
            setLoading(false);
        }
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
    const handleApproveUser = async (userId, email) => {
        const initials = userInitials[userId];

        if (!initials || initials.length !== 2) {
            alert('❌ Please enter 2-letter initials (e.g., AD, RF)');
            return;
        }

        if (!confirm(`Approve user ${email} with initials ${initials}?`)) return;

        try {
            setLoading(true);
            const { error } = await supabase.rpc('approve_user', {
                p_user_id: userId,
                p_initials: initials.toUpperCase(),
                p_approved_by: user.id
            });

            if (error) throw error;

            alert(`✅ User ${email} approved with initials ${initials}!`);
            fetchPendingUsers(); // Refresh list
            setUserInitials(prev => {
                const updated = { ...prev };
                delete updated[userId];
                return updated;
            });
        } catch (error) {
            console.error('Error approving user:', error);
            alert(`❌ Failed to approve user: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Reject user
    const handleRejectUser = async (userId, email) => {
        if (!confirm(`Reject and delete user ${email}? This cannot be undone.`)) return;

        try {
            setLoading(true);
            const { error } = await supabase.rpc('reject_user', {
                p_user_id: userId
            });

            if (error) throw error;

            alert(`✅ User ${email} rejected and deleted.`);
            fetchPendingUsers(); // Refresh list
        } catch (error) {
            console.error('Error rejecting user:', error);
            alert(`❌ Failed to reject user: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
                <p className="text-gray-600">User Approvals, AWB Approvals & Shipment Status Updates</p>
            </header>

            {/* Pending User Approvals Section */}
            <div className="card mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">👤 Pending User Approvals</h2>

                {loadingUsers ? (
                    <p className="text-gray-500">Loading users...</p>
                ) : pendingUsers.length === 0 ? (
                    <p className="text-gray-500">No pending user approvals</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Initials</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pendingUsers.map((usr) => (
                                    <tr key={usr.user_id}>
                                        <td className="px-4 py-3 text-sm text-gray-900">{usr.email}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{usr.full_name || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(usr.created_at)}</td>
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
                                                className="w-16 px-2 py-1 border border-gray-300 rounded text-center font-mono uppercase"
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

            {/* Pending AWB Requests Section */}
            <div className="card mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">📦 Pending AWB Requests</h2>

                {loadingRequests ? (
                    <p className="text-gray-500">Loading requests...</p>
                ) : pendingRequests.length === 0 ? (
                    <p className="text-gray-500">No pending AWB requests</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Initial</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pendingRequests.map((req) => (
                                    <tr key={req.request_id}>
                                        <td className="px-4 py-3 text-sm text-gray-900">{req.sales_name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{req.customer_name}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded font-mono text-xs">
                                                {req.sales_initial}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(req.requested_at)}</td>
                                        <td className="px-4 py-3 text-sm">
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
