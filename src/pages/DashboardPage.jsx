import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate, getStatusColor } from '../lib/utils';

export default function DashboardPage({ onEditInquiry }) {
    const { user, profile } = useAuth();
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalGP: 0,
        activeInquiries: 0,
        totalLeads: 0,
    });
    const [todoList, setTodoList] = useState([]);

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch Inquiries (all if super admin, own if regular user)
            const { data: inqData, error: inqError } = await supabase
                .from('inquiries')
                .select('*')
                .order('created_at', { ascending: false });

            if (inqError) throw inqError;

            // Fetch Leads Count (all if super admin, own if regular user)
            const { count, error: leadError } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true });

            if (leadError) throw leadError;

            setInquiries(inqData || []);
            calculateStats(inqData || [], count || 0);
            generateTodoList(inqData || []);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data, leadCount) => {
        const totalRevenue = data
            .filter(inq => inq.status === 'Won' || inq.status === 'Invoiced' || inq.status === 'Paid')
            .reduce((sum, inq) => sum + (parseFloat(inq.est_revenue) || 0), 0);

        const totalGP = data
            .filter(inq => inq.status === 'Won' || inq.status === 'Invoiced' || inq.status === 'Paid')
            .reduce((sum, inq) => sum + (parseFloat(inq.est_gp) || 0), 0);

        const activeInquiries = data.filter(
            inq => !['Won', 'Lost', 'Paid'].includes(inq.status)
        ).length;

        setStats({ totalRevenue, totalGP, activeInquiries, totalLeads: leadCount });
    };

    const generateTodoList = (data) => {
        const tasks = [];
        data.forEach(inq => {
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
        setTodoList(tasks.slice(0, 5)); // Show top 5
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
            'Urgent': 'bg-red-100 text-red-800',
            'Follow Up': 'bg-yellow-100 text-yellow-800',
            'Closing': 'bg-green-100 text-green-800',
            'Payment': 'bg-purple-100 text-purple-800',
        };
        return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[type] || 'bg-gray-100'}`}>{type}</span>;
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
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
                <p className="text-gray-600">Welcome, {user?.email}</p>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="card p-4">
                    <h3 className="text-xs font-medium text-gray-500 uppercase">Total Revenue</h3>
                    <p className="text-xl font-bold text-primary-600 mt-1">
                        {formatCurrency(stats.totalRevenue)}
                    </p>
                </div>

                {/* Total GP - Admin Only */}
                {profile?.role === 'admin' && (
                    <div className="card p-4">
                        <h3 className="text-xs font-medium text-gray-500 uppercase">Total GP</h3>
                        <p className="text-xl font-bold text-green-600 mt-1">
                            {formatCurrency(stats.totalGP)}
                        </p>
                    </div>
                )}

                <div className="card p-4">
                    <h3 className="text-xs font-medium text-gray-500 uppercase">Active Inquiries</h3>
                    <p className="text-2xl font-bold text-orange-600 mt-1">
                        {stats.activeInquiries}
                    </p>
                </div>
                <div className="card p-4">
                    <h3 className="text-xs font-medium text-gray-500 uppercase">Total Leads</h3>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                        {stats.totalLeads}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* To-Do List Widget */}
                <div className="card lg:col-span-1 h-fit">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                        <h2 className="text-lg font-semibold text-gray-800">⚡ To-Do List</h2>
                        <span className="text-xs text-gray-500">{todoList.length} tasks</span>
                    </div>
                    {todoList.length === 0 ? (
                        <p className="text-gray-500 text-sm p-2">🎉 All caught up! No pending tasks.</p>
                    ) : (
                        <ul className="space-y-3">
                            {todoList.map((task, idx) => (
                                <li key={idx} className="flex flex-col p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => onEditInquiry && onEditInquiry(inquiries.find(i => i.id === task.id))}>
                                    <div className="flex justify-between items-start">
                                        {renderTodoBadge(task.type)}
                                        <span className="text-xs text-gray-400">Action req.</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 mt-1">{task.text}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Inquiries Table */}
                <div className="card lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Active Inquiries</h2>
                        <button
                            onClick={fetchDashboardData}
                            className="text-sm text-primary-600 hover:text-primary-700"
                        >
                            🔄 Refresh
                        </button>
                    </div>

                    {inquiries.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                            No inquiries yet. Create your first one!
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue / GP</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {inquiries.slice(0, 10).map((inquiry) => (
                                        <tr key={inquiry.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm">
                                                <div className="font-medium text-gray-900">{inquiry.customer_name}</div>
                                                <div className="text-xs text-gray-500">{inquiry.origin} → {inquiry.destination}</div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                                                    {inquiry.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="text-gray-900">{formatCurrency(inquiry.est_revenue)}</div>
                                                <div className="text-xs text-green-600">GP: {formatCurrency(inquiry.est_gp)}</div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="flex space-x-2">
                                                    {inquiry.phone && (
                                                        <a href={`https://wa.me/${inquiry.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800" title="WhatsApp">📱</a>
                                                    )}
                                                    {inquiry.email && (
                                                        <a href={`mailto:${inquiry.email}`} className="text-blue-600 hover:text-blue-800" title="Email">📧</a>
                                                    )}
                                                    <button onClick={() => onEditInquiry && onEditInquiry(inquiry)} className="text-gray-600 hover:text-gray-800">✏️</button>
                                                </div>
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
