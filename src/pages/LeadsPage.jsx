import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, getLeadStatusColor } from '../lib/utils';
import LeadFormModal from '../components/LeadFormModal';

export default function LeadsPage({ onCreateRFQ }) {
    const { user } = useAuth();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [stats, setStats] = useState({
        totalLeads: 0,
        hotLeads: 0,
    });

    useEffect(() => {
        fetchLeads();
    }, [user]);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setLeads(data || []);
            calculateStats(data || []);
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const totalLeads = data.length;
        const hotLeads = data.filter(lead => lead.status === 'Hot').length;
        setStats({ totalLeads, hotLeads });
    };

    const handleEdit = (lead) => {
        setEditingLead(lead);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this lead?')) return;

        try {
            const { error } = await supabase
                .from('leads')
                .delete()
                .eq('id', id);

            if (error) throw error;

            fetchLeads();
        } catch (error) {
            console.error('Error deleting lead:', error);
            alert('Failed to delete lead');
        }
    };

    const handleCreateRFQ = (lead) => {
        // Pass lead data to parent to navigate to inquiry form
        if (onCreateRFQ) {
            onCreateRFQ(lead);
        }
    };

    const handleModalClose = (shouldRefresh) => {
        setShowModal(false);
        setEditingLead(null);
        if (shouldRefresh) {
            fetchLeads();
        }
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
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
                        <p className="text-gray-600">Company & prospect database</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary"
                    >
                        ➕ New Lead
                    </button>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="card">
                    <h3 className="text-sm font-medium text-gray-500">Total Leads</h3>
                    <p className="text-2xl font-bold text-primary-600 mt-2">
                        {stats.totalLeads}
                    </p>
                </div>

                <div className="card">
                    <h3 className="text-sm font-medium text-gray-500">Hot Leads</h3>
                    <p className="text-2xl font-bold text-red-600 mt-2">
                        {stats.hotLeads}
                    </p>
                </div>
            </div>

            {/* Leads Table */}
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">All Leads</h2>
                    <button
                        onClick={fetchLeads}
                        className="text-sm text-primary-600 hover:text-primary-700"
                    >
                        🔄 Refresh
                    </button>
                </div>

                {leads.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        No leads yet. Create your first one!
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PIC</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {leads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                            {lead.company_name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {lead.pic_name || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {lead.phone || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {lead.email || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLeadStatusColor(lead.status)}`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {formatDate(lead.created_at)}
                                        </td>
                                        <td className="px-4 py-3 text-sm space-x-2">
                                            <div className="flex space-x-2">
                                                {lead.phone && (
                                                    <a
                                                        href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-green-600 hover:text-green-800"
                                                        title="WhatsApp"
                                                    >
                                                        📱
                                                    </a>
                                                )}
                                                {lead.email && (
                                                    <a
                                                        href={`mailto:${lead.email}`}
                                                        className="text-blue-600 hover:text-blue-800"
                                                        title="Email"
                                                    >
                                                        📧
                                                    </a>
                                                )}
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.company_name)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-orange-600 hover:text-orange-800"
                                                    title="Search on Maps"
                                                >
                                                    📍
                                                </a>
                                                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                                <button
                                                    onClick={() => handleCreateRFQ(lead)}
                                                    className="text-indigo-600 hover:text-indigo-800"
                                                    title="Create RFQ"
                                                >
                                                    📝
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(lead)}
                                                    className="text-gray-600 hover:text-gray-800"
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(lead.id)}
                                                    className="text-red-400 hover:text-red-600"
                                                    title="Delete"
                                                >
                                                    🗑️
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

            {/* Lead Form Modal */}
            {showModal && (
                <LeadFormModal
                    lead={editingLead}
                    onClose={handleModalClose}
                />
            )}
        </div>
    );
}
