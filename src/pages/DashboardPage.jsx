import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate, getStatusColor } from '../lib/utils';

export default function DashboardPage({ onEditInquiry, onNavigate }) {
    const { user, profile } = useAuth();
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalGP: 0,
        totalCommission: 0,
        activeInquiries: 0,
        totalLeads: 0,
    });
    const [todoList, setTodoList] = useState([]);

    // Admin Filter State
    const [salesReps, setSalesReps] = useState([]);
    const [selectedSalesId, setSelectedSalesId] = useState('all');

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    // Recalculate when filter changes
    useEffect(() => {
        // Ensure inquiries and stats.totalLeads are available before calculating
        if (inquiries.length > 0 || stats.totalLeads !== undefined) {
            calculateStats(inquiries, stats.totalLeads, selectedSalesId);
        }
    }, [selectedSalesId, inquiries, stats.totalLeads]); // Added stats.totalLeads to dependencies

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Inquiries (No Join to prevent errors)
            const { data: inqData, error: inqError } = await supabase
                .from('inquiries')
                .select('*')
                .order('created_at', { ascending: false });

            if (inqError) throw inqError;

            // 2. Fetch Profiles for Mapping (All Users)
            const { data: profilesData, error: profError } = await supabase
                .from('profiles')
                .select('id, full_name, email');

            if (profError) console.error('Error fetching profiles:', profError);

            // Save profiles for Dropdown & Table Lookup
            setSalesReps(profilesData || []);

            // 3. Fetch Leads Count
            const { count, error: leadError } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true });

            if (leadError) throw leadError;

            setInquiries(inqData || []);

            // Initial Calculation (All)
            calculateStats(inqData || [], count || 0, 'all');

            // Fetch Admin Pending Items if Admin
            let pUsers = [], pComms = [], pReqs = [];
            if (profile?.role === 'admin') {
                const { data: dUsers } = await supabase.rpc('get_pending_users');
                const { data: dComms } = await supabase.rpc('get_pending_commissions');
                const { data: dReqs } = await supabase.rpc('get_pending_awb_requests');
                pUsers = dUsers || [];
                pComms = dComms || [];
                pReqs = dReqs || [];
            }
            generateTodoList(inqData || [], pUsers, pComms, pReqs);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to get sales name
    const getSalesName = (userId) => {
        const rep = salesReps.find(r => r.id === userId);
        return rep ? (rep.full_name || rep.email) : 'Unknown';
    };

    const calculateStats = (data, leadCount, filterId) => {
        // Filter Data first
        let filteredData = data;
        if (filterId !== 'all') {
            filteredData = data.filter(inq => inq.user_id === filterId);
        } else if (profile?.role !== 'admin') {
            // If not admin and filter is 'all', show only own inquiries
            filteredData = data.filter(inq => inq.user_id === user?.id);
        }

        const totalRevenue = filteredData
            .filter(inq => inq.status === 'Won' || inq.status === 'Invoiced' || inq.status === 'Paid')
            .reduce((sum, inq) => sum + (parseFloat(inq.est_revenue) || 0), 0);

        const totalGP = filteredData
            .filter(inq => inq.status === 'Won' || inq.status === 'Invoiced' || inq.status === 'Paid')
            .reduce((sum, inq) => sum + (parseFloat(inq.est_gp) || 0), 0);

        const totalCommission = filteredData
            .reduce((sum, inq) => sum + (parseFloat(inq.commission_amount || inq.est_commission) || 0), 0);

        const activeInquiries = filteredData.filter(
            inq => !['Won', 'Lost', 'Paid'].includes(inq.status)
        ).length;

        setStats({ totalRevenue, totalGP, totalCommission, activeInquiries, totalLeads: leadCount });
    };

    const generateTodoList = (data, pendingUsers = [], pendingCommissions = [], pendingRequests = []) => {
        const tasks = [];

        // 1. Admin Tasks (High Priority)
        if (profile?.role === 'admin') {
            if (pendingUsers.length > 0) {
                tasks.push({
                    type: 'Approval',
                    text: `${pendingUsers.length} New User(s) waiting for approval`,
                    link: 'ops'
                });
            }
            if (pendingCommissions.length > 0) {
                tasks.push({
                    type: 'Approval',
                    text: `${pendingCommissions.length} Commission(s) waiting for review`,
                    link: 'ops'
                });
            }
            if (pendingRequests.length > 0) {
                tasks.push({
                    type: 'Approval',
                    text: `${pendingRequests.length} AWB Request(s) pending`,
                    link: 'ops'
                });
            }
        }

        // 2. Sales Tasks
        // Filter sales tasks based on selectedSalesId if admin, or show only own tasks if not admin
        let salesTasksData = data;
        if (profile?.role === 'admin' && selectedSalesId !== 'all') {
            salesTasksData = data.filter(inq => inq.user_id === selectedSalesId);
        } else if (profile?.role !== 'admin') {
            salesTasksData = data.filter(inq => inq.user_id === user?.id);
        }

        salesTasksData.forEach(inq => {
            const daysSince = (new Date() - new Date(inq.created_at)) / (1000 * 60 * 60 * 24);

            if (inq.status === 'Profiling') {
                tasks.push({ type: 'Urgent', text: `Send Proposal to ${inq.customer_name}`, id: inq.id });
                return;
            }
            if (inq.status === 'Proposal' && daysSince > 2) {
                tasks.push({ type: 'Follow Up', text: `Follow up ${inq.customer_name} (Sent 2 days ago)`, id: inq.id });
                return;
            }
            if (inq.status === 'Negotiation') {
                tasks.push({ type: 'Closing', text: `Close deal with ${inq.customer_name}`, id: inq.id });
                return;
            }
            if (inq.status === 'Invoiced' && daysSince > 14) {
                tasks.push({ type: 'Payment', text: `Check payment from ${inq.customer_name}`, id: inq.id });
                return;
            }
        });
        setTodoList(tasks.slice(0, 7)); // Show top 7
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this inquiry?')) return;

        try {
            const { error } = await supabase
                .from('inquiries')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchDashboardData();
        } catch (error) {
            console.error('Error deleting inquiry:', error);
            alert('Failed to delete inquiry');
        }
    };

    const renderTodoBadge = (type) => {
        const colors = {
            'Urgent': 'bg-red-900/50 text-red-200 border border-red-800',
            'Follow Up': 'bg-yellow-900/50 text-yellow-200 border border-yellow-800',
            'Closing': 'bg-green-900/50 text-green-200 border border-green-800',
            'Payment': 'bg-purple-900/50 text-purple-200 border border-purple-800',
            'Approval': 'bg-blue-900/50 text-blue-200 border border-blue-800',
        };
        return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colors[type] || 'bg-gray-800 text-gray-400'}`}>{type}</span>;
    };

    // Helper to get displayed inquiries
    const getDisplayedInquiries = () => {
        if (profile?.role === 'admin') {
            if (selectedSalesId === 'all') return inquiries;
            return inquiries.filter(inq => inq.user_id === selectedSalesId);
        }
        // Regular user sees only their own inquiries
        return inquiries.filter(inq => inq.user_id === user?.id);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-100">Sales Dashboard (v2.9)</h1>
                    <p className="text-gray-400">Welcome, {user?.email}</p>
                </div>

                {/* ADMIN FILTER DROPDOWN */}
                {profile?.role === 'admin' && (
                    <div className="flex items-center space-x-2 bg-secondary-800 p-2 rounded-lg border border-gray-700">
                        <span className="text-xs text-gray-400 uppercase font-bold">Filter Sales:</span>
                        <select
                            value={selectedSalesId}
                            onChange={(e) => setSelectedSalesId(e.target.value)}
                            className="bg-secondary-900 text-gray-200 text-sm rounded border border-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-1"
                        >
                            <option value="all">⭐ All Sales Team</option>
                            {salesReps.map(rep => (
                                <option key={rep.id} value={rep.id}>
                                    👤 {rep.full_name || rep.email}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="card p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                        {selectedSalesId === 'all' && profile?.role === 'admin' ? 'Total Revenue' : 'Sales Revenue'}
                    </h3>
                    <p className="text-xl font-bold text-primary-400 mt-1 shadow-gold">
                        {formatCurrency(stats.totalRevenue)}
                    </p>
                </div>

                {/* Total GP - Admin Only */}
                {profile?.role === 'admin' && (
                    <div className="card p-4">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                            {selectedSalesId === 'all' ? 'Total GP' : 'Sales GP'}
                        </h3>
                        <p className="text-xl font-bold text-green-400 mt-1">
                            {formatCurrency(stats.totalGP)}
                        </p>
                    </div>
                )}

                {/* Total Commission - Visible to All */}
                <div className="card p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                        {profile?.role === 'admin' && selectedSalesId === 'all' ? 'Total Commission' : 'Your Commission'}
                    </h3>
                    <p className="text-xl font-bold text-yellow-400 mt-1 shadow-gold">
                        {formatCurrency(stats.totalCommission)}
                    </p>
                </div>

                <div className="card p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Active Inquiries</h3>
                    <p className="text-2xl font-bold text-orange-400 mt-1">
                        {stats.activeInquiries}
                    </p>
                </div>
                {/* Total Leads card removed as per instruction */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* To-Do List Widget (Simplified for now) */}
                <div className="card lg:col-span-1 h-fit">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                        <h2 className="text-lg font-semibold text-gray-200">⚡ Recent Activity</h2>
                    </div>
                    <p className="text-gray-500 text-sm p-2">To-Do List filtered by system.</p>
                </div>

                {/* Inquiries Table */}
                <div className="card lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-200">
                            {selectedSalesId === 'all' && profile?.role === 'admin' ? 'All Active Inquiries' : 'Sales Inquiries'}
                        </h2>
                        <button
                            onClick={fetchDashboardData}
                            className="text-xs text-primary-400 hover:text-primary-300 uppercase tracking-wider font-semibold"
                        >
                            🔄 Refresh
                        </button>
                    </div>

                    {getDisplayedInquiries().length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                            No inquiries yet. Create your first one!
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-secondary-900/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sales</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Financials</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {getDisplayedInquiries().slice(0, 15).map((inquiry) => (
                                        <tr key={inquiry.id} className="hover:bg-secondary-700/50 transition-colors">
                                            <td className="px-4 py-3 text-sm">
                                                <div className="font-medium text-gray-200">{inquiry.customer_name}</div>
                                                <div className="text-xs text-gray-500">{inquiry.origin} → {inquiry.destination}</div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-400">
                                                {getSalesName(inquiry.user_id)}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                                                    {inquiry.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="text-gray-300 font-mono text-xs">Rev: {formatCurrency(inquiry.est_revenue)}</div>
                                                {(inquiry.commission_amount > 0 || inquiry.est_commission > 0) && (
                                                    <div className={`font-mono text-xs ${inquiry.commission_status === 'Approved' ? 'text-yellow-400' : 'text-gray-500'}`}>
                                                        Comm: {formatCurrency(inquiry.commission_amount || inquiry.est_commission)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <button onClick={() => onEditInquiry && onEditInquiry(inquiry)} className="text-gray-400 hover:text-white transition-colors">✏️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
