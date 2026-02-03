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
        potentialRevenue: 0,
        lostRevenue: 0,
        totalGP: 0,

        // COMMISSION BREAKDOWN
        commProjection: 0, // Potential (Proposal/Nego)
        commWon: 0,        // Realized but NOT Paid
        commPaid: 0,       // Paid to Sales

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

            // 1. Fetch Inquiries
            const inqData = await inquiryService.getDashboardData(profile?.role, user?.id, 'all');

            // 2. Fetch Profiles 
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

    // Helper: Determine if commission is valid/visible based on status
    const shouldShowCommission = (status) => {
        if (!status) return false;
        const s = status.toLowerCase().trim();
        return !['lost', 'cancelled'].includes(s);
    };

    const calculateStats = (data, leadCount, filterId) => {
        if (!data) return;

        let filteredData = data;

        // Frontend Filtering for Stats (Dynamic)
        if (profile?.role === 'admin' && filterId !== 'all') {
            filteredData = data.filter(inq => inq.user_id === filterId);
        } else if (profile?.role !== 'admin') {
            filteredData = data.filter(inq => inq.user_id === user?.id);
        }

        // --- REVENUE CALC ---
        const totalRevenue = filteredData
            .filter(inq => ['Won', 'Invoiced', 'Paid'].includes(inq.status))
            .reduce((sum, inq) => sum + (parseFloat(inq.est_revenue) || 0), 0);

        const potentialRevenue = filteredData
            .filter(inq => ['Profiling', 'Proposal', 'Negotiation'].includes(inq.status))
            .reduce((sum, inq) => sum + (parseFloat(inq.est_revenue) || 0), 0);

        const lostRevenue = filteredData
            .filter(inq => ['Lost', 'Cancelled'].includes(inq.status))
            .reduce((sum, inq) => sum + (parseFloat(inq.est_revenue) || 0), 0);

        const totalGP = filteredData
            .filter(inq => ['Won', 'Invoiced', 'Paid'].includes(inq.status))
            .reduce((sum, inq) => sum + (parseFloat(inq.est_gp) || 0), 0);

        // --- COMMISSION BREAKDOWN ---

        // 1. Projection (Potential Deals)
        const commProjection = filteredData
            .filter(inq => ['Profiling', 'Proposal', 'Negotiation'].includes(inq.status))
            .reduce((sum, inq) => sum + (parseFloat(inq.est_commission) || 0), 0);

        // 2. Won (Realized but Unpaid)
        // Includes: Won/Invoiced/Paid where commission_status IS NOT 'Paid'
        const commWon = filteredData
            .filter(inq =>
                ['Won', 'Invoiced', 'Paid'].includes(inq.status) &&
                inq.commission_status !== 'Paid'
            )
            .reduce((sum, inq) => sum + (parseFloat(inq.commission_amount || inq.est_commission) || 0), 0);

        // 3. Paid (Fully Transferred)
        const commPaid = filteredData
            .filter(inq => inq.commission_status === 'Paid')
            .reduce((sum, inq) => sum + (parseFloat(inq.commission_amount || inq.est_commission) || 0), 0);

        const activeInquiries = filteredData.filter(
            inq => !['Won', 'Lost', 'Paid'].includes(inq.status)
        ).length;

        setStats({
            totalRevenue,
            potentialRevenue,
            lostRevenue,
            totalGP,

            commProjection,
            commWon,
            commPaid,

            activeInquiries,
            totalLeads: leadCount
        });
    };

    const generateTodoList = (data, pendingUsers = [], pendingCommissions = [], pendingRequests = []) => {
        const tasks = [];
        if (profile?.role === 'admin') {
            if (pendingUsers.length > 0) tasks.push({ id: 'users', type: 'admin', title: `👥 ${pendingUsers.length} User Approval`, desc: 'New users', priority: 'high' });
            if (pendingCommissions.length > 0) tasks.push({ id: 'commissions', type: 'admin', title: `💰 ${pendingCommissions.length} Commission Approval`, desc: 'Review commissions', priority: 'high' });
            if (pendingRequests.length > 0) tasks.push({ id: 'awb', type: 'admin', title: `📦 ${pendingRequests.length} AWB Request`, desc: 'Sales requests', priority: 'medium' });
        }
        const followUps = data.filter(inq => (inq.status === 'Profiling' || inq.status === 'Proposal') && (inq.user_id === user?.id));
        if (followUps.length > 0) tasks.push({ id: 'followup', type: 'sales', title: `📞 ${followUps.length} Follow Ups`, desc: 'Active deals', priority: 'medium' });
        setTodoList(tasks);
    };

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
                    <div className="flex items-center gap-2">
                        <p className="text-gray-400 text-sm">v3.9.1 - Commission Breakdown</p>
                        <button
                            onClick={() => {
                                if ('serviceWorker' in navigator) {
                                    navigator.serviceWorker.getRegistrations().then(function (registrations) {
                                        for (let registration of registrations) {
                                            registration.unregister();
                                        }
                                        window.location.reload(true);
                                    });
                                } else {
                                    window.location.reload(true);
                                }
                            }}
                            className="bg-red-900/50 hover:bg-red-800 text-red-200 text-[10px] px-2 py-0.5 rounded border border-red-700/50"
                        >
                            ⚠️ Force Update
                        </button>
                    </div>
                </div>
                {profile?.role === 'admin' && (
                    <div className="flex items-center space-x-2 bg-secondary-800 p-2 rounded-lg border border-gray-700">
                        <span className="text-xs text-gray-400 uppercase font-bold">Filter Sales:</span>
                        <select
                            value={selectedSalesId}
                            onChange={(e) => setSelectedSalesId(e.target.value)}
                            className="bg-secondary-900 text-gray-200 text-sm rounded border border-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-1"
                        >
                            <option value="all">⭐ All Sales Team</option>
                            {salesReps.map(rep => (<option key={rep.id} value={rep.id}>👤 {rep.full_name || rep.email}</option>))}
                        </select>
                    </div>
                )}
            </header>

            {/* GRID LAYOUT - Adjusted for extra card width if needed */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${profile?.role === 'admin' ? '5' : '4'} gap-4 mb-6`}>

                {/* 1. REVENUE (WON) */}
                <div className="card p-4 relative overflow-hidden group">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest relative z-10">
                        {selectedSalesId === 'all' && profile?.role === 'admin' ? 'Realized Revenue' : 'My Revenue'}
                    </h3>
                    <p className="text-xl font-bold text-primary-400 mt-1 shadow-gold relative z-10">
                        {formatCurrency(stats.totalRevenue)}
                    </p>
                    <div className="absolute top-0 right-0 p-4 -mr-4 -mt-4 text-primary-900/10 group-hover:text-primary-900/20 transition-all">
                        <span className="text-6xl">💰</span>
                    </div>
                </div>

                {/* 2. PIPELINE (POTENTIAL) */}
                <div className="card p-4 relative overflow-hidden group">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest relative z-10">
                        Pipeline Value
                    </h3>
                    <p className="text-xl font-bold text-blue-400 mt-1 relative z-10">
                        {formatCurrency(stats.potentialRevenue)}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">Proposal & Negotiation</p>
                    <div className="absolute top-0 right-0 p-4 -mr-4 -mt-4 text-blue-900/10 group-hover:text-blue-900/20 transition-all">
                        <span className="text-6xl">📈</span>
                    </div>
                </div>

                {/* 3. GP (Admin Only) */}
                {profile?.role === 'admin' && (
                    <div className="card p-4">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Total GP</h3>
                        <p className="text-xl font-bold text-green-400 mt-1">{formatCurrency(stats.totalGP)}</p>
                    </div>
                )}

                {/* 4. COMMISSION (SPLIT) */}
                <div className="card p-3 flex flex-col justify-between relative overflow-hidden">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                        {profile?.role === 'admin' && selectedSalesId === 'all' ? 'Total Commission' : 'My Commission'}
                    </h3>

                    {/* Paid */}
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-green-400 font-bold">Paid</span>
                        <span className="text-sm font-bold text-green-400">{formatCurrency(stats.commPaid)}</span>
                    </div>

                    {/* Unpaid (Won) */}
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-yellow-400 font-medium">Unpaid</span>
                        <span className="text-sm font-bold text-yellow-400">{formatCurrency(stats.commWon)}</span>
                    </div>

                    {/* Projection */}
                    <div className="pt-2 mt-1 border-t border-gray-700 flex justify-between items-center">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Projection</span>
                        <span className="text-xs font-mono text-gray-400">{formatCurrency(stats.commProjection)}</span>
                    </div>
                </div>

                {/* 5. Inquiries Count */}
                <div className="card p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Active Inquiries</h3>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-orange-400 mt-1">{stats.activeInquiries}</p>
                    </div>
                    {stats.lostRevenue > 0 && (
                        <p className="text-[10px] text-red-400/70 mt-1">Lost: {formatCurrency(stats.lostRevenue)}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* To-Do List */}
                <div className="card lg:col-span-1 h-fit">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                        <h2 className="text-lg font-semibold text-gray-200">⚡ Recent Activity</h2>
                    </div>
                    {todoList.length === 0 ? <p className="text-gray-500 text-sm p-2">🎉 All caught up!</p> : (
                        <div className="space-y-3">
                            {todoList.map((item, idx) => (
                                <div key={idx} className={`p-3 rounded-lg border ${item.priority === 'high' ? 'bg-red-900/20 border-red-800' : 'bg-secondary-800 border-gray-700'}`}>
                                    <h4 className={`text-sm font-bold ${item.priority === 'high' ? 'text-red-400' : 'text-primary-400'}`}>{item.title}</h4>
                                    <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="card lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-200">{selectedSalesId === 'all' && profile?.role === 'admin' ? 'All Active Inquiries' : 'Sales Inquiries'}</h2>
                        <button onClick={fetchDashboardData} className="text-xs text-primary-400 hover:text-primary-300 uppercase font-semibold">🔄 Refresh</button>
                    </div>

                    {getDisplayedInquiries().length === 0 ? <p className="text-gray-500 text-center py-8">No inquiries yet.</p> : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-secondary-900/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sales</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Revenue</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Commission</th>
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
                                            <td className="px-4 py-3 text-sm text-gray-400">{getSalesName(inquiry.user_id)}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>{inquiry.status}</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="text-gray-300 font-mono text-xs">{formatCurrency(inquiry.est_revenue)}</div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {/* Logic for showing commission */}
                                                {shouldShowCommission(inquiry.status) && (parseFloat(inquiry.commission_amount || inquiry.est_commission) > 0) ? (
                                                    <div className="flex flex-col">
                                                        <span className={`font-mono text-xs ${inquiry.commission_status === 'Paid' ? 'text-green-400 font-bold' : (inquiry.commission_status === 'Approved' || inquiry.commission_approved ? 'text-yellow-400' : 'text-gray-500')}`}>
                                                            {formatCurrency(inquiry.commission_amount || inquiry.est_commission)}
                                                        </span>
                                                        {inquiry.commission_status === 'Paid' && <span className="text-[9px] text-green-500 uppercase tracking-wider">PAID</span>}
                                                    </div>
                                                ) : <div className="font-mono text-xs text-gray-600">-</div>}
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
