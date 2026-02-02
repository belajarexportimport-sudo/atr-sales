import { useState, useEffect } from 'react';
// import { supabase } from '../lib/supabase'; // REMOVED: Services only
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, getStatusColor, calculateCommission } from '../lib/utils';
// Services
import { inquiryService } from '../services/inquiryService';
import { userService } from '../services/userService';
import { leadService } from '../services/leadService';
import { commissionService } from '../services/commissionService';

export default function DashboardPage({ onEditInquiry }) {
    const { user, profile } = useAuth();
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalGP: 0,
        totalCommission: 0,
        activeInquiries: 0,
        totalLeads: 0
    });
    const [inquiries, setInquiries] = useState([]);
    const [salesReps, setSalesReps] = useState([]);
    const [selectedSalesId, setSelectedSalesId] = useState('all');
    const [loading, setLoading] = useState(true);
    const [todoList, setTodoList] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, [profile]); // Fetch when profile loads

    useEffect(() => {
        // Ensure inquiries available before calculating
        if (inquiries.length > 0 || stats.totalLeads !== undefined) {
            calculateStats(inquiries, stats.totalLeads, selectedSalesId);
        }
    }, [selectedSalesId, inquiries, stats.totalLeads]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Inquiries (Services handles Admin/Sales logic internally, but for Dashboard "All" view
            // we might need raw access. However, inquiryService.getDashboardData handles filters.)
            // For the initial load, we want EVERYTHING (for admin) or OWN (for sales).
            // inquiryService.getDashboardData defaults to 'all' filter for admin.
            const inqData = await inquiryService.getDashboardData(profile?.role, user?.id, 'all');

            // 2. Fetch Profiles (Admin Only or for Sales Name mapping)
            // We need profiles to map names in the table even for 'all' view.
            const profilesData = await userService.getAllSalesReps();
            setSalesReps(profilesData);

            // 3. Fetch Leads Count
            const leadCount = await leadService.getCount();

            setInquiries(inqData);

            // Calculate initial stats
            calculateStats(inqData, leadCount, 'all');

            // 4. Fetch Admin Todo Items
            let pUsers = [], pComms = [], pReqs = [];
            if (profile?.role === 'admin') {
                const [dUsers, dComms, dReqs] = await Promise.all([
                    userService.getPendingUsers(),
                    commissionService.getPendingCommissionsList(),
                    inquiryService.getPendingAWBRequests()
                ]);
                pUsers = dUsers;
                pComms = dComms;
                pReqs = dReqs;
            }
            generateTodoList(inqData, pUsers, pComms, pReqs);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSalesName = (id) => {
        const rep = salesReps.find(r => r.id === id);
        return rep ? (rep.full_name || rep.email) : 'Unknown';
    };

    const calculateStats = (data, leadCount, filterId) => {
        if (!data) return;

        let filteredData = data;

        // Frontend Filtering for Stats (Dynamic)
        if (profile?.role === 'admin' && filterId !== 'all') {
            filteredData = data.filter(inq => inq.user_id === filterId);
        } else if (profile?.role !== 'admin') {
            // Safety double-check, though Service handles this
            filteredData = data.filter(inq => inq.user_id === user?.id);
        }

        const totalRevenue = filteredData
            .filter(inq => ['Won', 'Invoiced', 'Paid'].includes(inq.status))
            .reduce((sum, inq) => sum + (parseFloat(inq.est_revenue) || 0), 0);

        const totalGP = filteredData
            .filter(inq => ['Won', 'Invoiced', 'Paid'].includes(inq.status))
            .reduce((sum, inq) => sum + (parseFloat(inq.est_gp) || 0), 0);

        // Uses commission_amount (Verified) if available, else est_commission
        const totalCommission = filteredData
            .reduce((sum, inq) => sum + (parseFloat(inq.commission_amount || inq.est_commission) || 0), 0);

        const activeInquiries = filteredData.filter(
            inq => !['Won', 'Lost', 'Paid'].includes(inq.status)
        ).length;

        setStats({ totalRevenue, totalGP, totalCommission, activeInquiries, totalLeads: leadCount });
    };

    const generateTodoList = (data, pendingUsers = [], pendingCommissions = [], pendingRequests = []) => {
        const tasks = [];

        // 1. Admin Tasks
        if (profile?.role === 'admin') {
            if (pendingUsers.length > 0) {
                tasks.push({
                    id: 'users',
                    type: 'admin',
                    title: `👥 ${pendingUsers.length} User Approval`,
                    desc: 'New users waiting for access',
                    priority: 'high'
                });
            }
            if (pendingCommissions.length > 0) {
                tasks.push({
                    id: 'commissions',
                    type: 'admin',
                    title: `💰 ${pendingCommissions.length} Commission Approval`,
                    desc: 'Review sales commissions',
                    priority: 'high'
                });
            }
            if (pendingRequests.length > 0) {
                tasks.push({
                    id: 'awb',
                    type: 'admin',
                    title: `📦 ${pendingRequests.length} AWB Request`,
                    desc: 'Sales requesting AWB numbers',
                    priority: 'medium'
                });
            }
        }

        // 2. Sales Tasks (Follow Ups)
        const followUps = data.filter(inq =>
            (inq.status === 'Profiling' || inq.status === 'Proposal') &&
            (inq.user_id === user?.id) // Only own tasks
        );

        if (followUps.length > 0) {
            tasks.push({
                id: 'followup',
                type: 'sales',
                title: `📞 ${followUps.length} Follow Ups`,
                desc: 'Profiling/Proposal stage inquiries',
                priority: 'medium'
            });
        }

        setTodoList(tasks);
    };

    // Filter displayed rows based on selectedSalesId
    const getDisplayedInquiries = () => {
        if (profile?.role === 'admin' && selectedSalesId !== 'all') {
            return inquiries.filter(inq => inq.user_id === selectedSalesId);
        }
        return inquiries;
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Loading Dashboard...</div>;

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <header className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-100">
                        Hello, {profile?.full_name?.split(' ')[0] || 'Sales'} 👋
                    </h1>
                    <p className="text-gray-400 text-sm">Here is your sales overview</p>
                </div>

                {/* Admin Sales Filter */}
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* To-Do List Widget */}
                <div className="card lg:col-span-1 h-fit">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                        <h2 className="text-lg font-semibold text-gray-200">⚡ Recent Activity</h2>
                    </div>
                    {todoList.length === 0 ? (
                        <p className="text-gray-500 text-sm p-2">🎉 All caught up! No pending tasks.</p>
                    ) : (
                        <div className="space-y-3">
                            {todoList.map((item, idx) => (
                                <div key={idx} className={`p-3 rounded-lg border ${item.priority === 'high' ? 'bg-red-900/20 border-red-800' : 'bg-secondary-800 border-gray-700'}`}>
                                    <h4 className={`text-sm font-bold ${item.priority === 'high' ? 'text-red-400' : 'text-primary-400'}`}>
                                        {item.title}
                                    </h4>
                                    <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    )}
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
                                                    <div className={`font-mono text-xs ${inquiry.commission_status === 'Approved' || inquiry.commission_approved ? 'text-yellow-400' : 'text-gray-500'}`}>
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
