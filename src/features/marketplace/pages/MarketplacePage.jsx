import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { inquiryService } from '../../../services/inquiryService';
import { useToast } from '../../../contexts/ToastContext';
import { formatCurrency, formatDate } from '../../../lib/utils';

export default function MarketplacePage() {
    const { user, profile } = useAuth();
    const { showToast } = useToast();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [grabbingId, setGrabbingId] = useState(null);

    useEffect(() => {
        fetchLeads();

        // Polling every 10 seconds for real-time feel (until we implement Realtime Subscription)
        const interval = setInterval(fetchLeads, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchLeads = async () => {
        try {
            const data = await inquiryService.getOpenInquiries();
            setLeads(data);
        } catch (error) {
            console.error('Error fetching marketplace leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGrab = async (lead) => {
        setGrabbingId(lead.id);
        try {
            const success = await inquiryService.grabInquiry(lead.id, user.id);
            if (success) {
                showToast('🚀 Succcess! You grabbed the lead.', 'success');
                // Remove from list immediately
                setLeads(prev => prev.filter(l => l.id !== lead.id));
            } else {
                showToast('❌ Too slow! Someone else took it.', 'error');
                fetchLeads(); // Refresh to sync
            }
        } catch (error) {
            showToast('Error grabbing lead', 'error');
        } finally {
            setGrabbingId(null);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Loading Marketplace...</div>;

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                    🦈 Open Market <span className="text-xs bg-primary-900 text-primary-200 px-2 py-1 rounded-full">{leads.length} Available</span>
                </h1>
                <p className="text-gray-400 text-sm mt-1">Grab high-value leads before others do!</p>
            </header>

            {leads.length === 0 ? (
                <div className="text-center py-12 bg-secondary-800/50 rounded-xl border border-gray-700 border-dashed">
                    <p className="text-4xl mb-4">🌊</p>
                    <h3 className="text-xl font-bold text-gray-300">Pool is Empty</h3>
                    <p className="text-gray-500 text-sm mt-2">Wait for Admin to inject new RFQs...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {leads.map(lead => (
                        <div key={lead.id} className="card p-4 relative overflow-hidden group hover:border-primary-500/50 transition-all">
                            {/* Urgent Badge if created recently */}
                            {new Date(lead.created_at) > new Date(Date.now() - 3600000) && (
                                <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                                    🔥 NEW
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-200">
                                        {lead.origin} ✈️ {lead.destination}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        ID: {lead.id.slice(0, 8)}...
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                                <div className="bg-secondary-900/50 p-2 rounded">
                                    <span className="text-gray-500 text-xs block">Weight</span>
                                    <span className="font-mono text-gray-300">{lead.est_weight} kg</span>
                                </div>
                                <div className="bg-secondary-900/50 p-2 rounded">
                                    <span className="text-gray-500 text-xs block">Volume</span>
                                    <span className="font-mono text-gray-300">{lead.est_volume} cbm</span>
                                </div>
                                <div className="bg-secondary-900/50 p-2 rounded col-span-2">
                                    <span className="text-gray-500 text-xs block">Est. Commission</span>
                                    <span className="font-mono text-green-400 font-bold">{formatCurrency(lead.est_commission || 0)}</span>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 italic mb-4">
                                Customer: {lead.customer_name ? lead.customer_name.slice(0, 3) + '*** (Masked)' : 'Unknown'}
                            </p>

                            <button
                                onClick={() => handleGrab(lead)}
                                disabled={grabbingId === lead.id}
                                className={`w-full py-3 rounded-lg font-bold text-center transition-all transform active:scale-95 ${grabbingId === lead.id
                                    ? 'bg-gray-700 text-gray-400 cursor-wait'
                                    : 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-900/50 hover:shadow-primary-500/30'
                                    }`}
                            >
                                {grabbingId === lead.id ? 'Attacking... 🦈' : 'GRAB THIS LEAD ⚡'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
