import { useState, useEffect } from 'react';
import { inquiryService } from '../services/inquiryService';
import { userService } from '../services/userService';
import { formatCurrency } from '../lib/utils'; // Assumed utils exist

export default function LeaderboardPage() {
    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('gmv'); // 'gmv', 'deals', 'gp'

    useEffect(() => {
        fetchLeaderboardData();
    }, []);

    const fetchLeaderboardData = async () => {
        try {
            setLoading(true);
            // Fetch All Inquiries (using 'admin' role context safely or a specific leaderboard endpoint)
            // Ideally we'd have a specific RPC, but let's re-use existing
            // Assuming getDashboardData allows fetching all if we pass suitable args or we might need to fetch raw
            // For now, let's try fetching all active inquiries.
            // Note: This might be heavy if many records, but for now it's fine.
            const allInquiries = await inquiryService.getDashboardData('admin', null, 'all');
            const salesReps = await userService.getAllSalesReps();

            // Aggregation Logic
            const aggregated = salesReps.map(rep => {
                const repDeals = allInquiries.filter(i => i.user_id === rep.id && ['Won', 'Invoiced', 'Paid'].includes(i.status));

                const gmv = repDeals.reduce((sum, i) => sum + (parseFloat(i.est_revenue) || 0), 0);
                const gp = repDeals.reduce((sum, i) => sum + (parseFloat(i.est_gp) || 0), 0);
                const deals = repDeals.length;

                return {
                    id: rep.id,
                    name: rep.full_name || rep.email?.split('@')[0],
                    avatar: rep.avatar_url || `https://ui-avatars.com/api/?name=${rep.full_name || 'User'}&background=random`,
                    gmv,
                    gp,
                    deals
                };
            });

            // Filter out those with 0 activity if desired, or keep them.
            // Let's keep them but sort.
            setRankings(aggregated);
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const getSortedRankings = () => {
        const sorted = [...rankings].sort((a, b) => b[filter] - a[filter]);
        return sorted;
    };

    const topThree = getSortedRankings().slice(0, 3);
    const rest = getSortedRankings().slice(3);

    const getMetricLabel = () => {
        switch (filter) {
            case 'gmv': return 'Total Revenue';
            case 'gp': return 'Gross Profit';
            case 'deals': return 'Total Deals';
            default: return '';
        }
    };

    const formatMetric = (val) => {
        if (filter === 'deals') return `${val} Deals`;
        return formatCurrency(val);
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Leaderboard...</div>;

    return (
        <div className="p-4 md:p-6 max-w-lg mx-auto md:max-w-4xl pb-20">
            <header className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">🏆 Sales Leaderboard</h1>
                <p className="text-gray-500 text-sm">Top Performers by {getMetricLabel()}</p>
            </header>

            {/* Filters */}
            <div className="flex justify-center gap-2 mb-8 bg-gray-100 p-1 rounded-full w-fit mx-auto">
                {['gmv', 'gp', 'deals'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${filter === f ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}
                    >
                        {f === 'gmv' ? 'Revenue' : f === 'gp' ? 'Profit' : 'Deals'}
                    </button>
                ))}
            </div>

            {/* PODIUM (Top 3) */}
            <div className="flex justify-center items-end gap-2 md:gap-8 mb-10 h-64">
                {/* 2nd Place (Silver) */}
                {topThree[1] && (
                    <div className="flex flex-col items-center w-1/3 md:w-1/4">
                        <div className="relative mb-2">
                            <img src={topThree[1].avatar} alt={topThree[1].name} className="w-16 h-16 rounded-full border-4 border-gray-300 shadow-lg object-cover" />
                            <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                                <span className="bg-gray-400 text-white text-xs font-bold px-2 rounded-full border border-white">2</span>
                            </div>
                        </div>
                        <div className="font-bold text-gray-800 text-sm text-center truncate w-full">{topThree[1].name}</div>
                        <div className="text-xs text-gray-500 font-mono">{formatMetric(topThree[1][filter])}</div>
                        <div className="h-24 w-full bg-gradient-to-t from-gray-300 to-gray-100 rounded-t-lg mt-2 opacity-80"></div>
                    </div>
                )}

                {/* 1st Place (Gold) */}
                {topThree[0] && (
                    <div className="flex flex-col items-center w-1/3 md:w-1/4 z-10 -mx-2">
                        <div className="relative mb-2">
                            <span className="absolute -top-6 text-3xl animate-bounce">👑</span>
                            <img src={topThree[0].avatar} alt={topThree[0].name} className="w-24 h-24 rounded-full border-4 border-yellow-400 shadow-xl object-cover" />
                            <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                                <span className="bg-yellow-500 text-white text-sm font-bold px-3 py-0.5 rounded-full border-2 border-white">1</span>
                            </div>
                        </div>
                        <div className="font-bold text-gray-900 text-lg text-center truncate w-full">{topThree[0].name}</div>
                        <div className="text-sm text-yellow-600 font-bold font-mono">{formatMetric(topThree[0][filter])}</div>
                        <div className="h-32 w-full bg-gradient-to-t from-yellow-300 via-yellow-200 to-yellow-100 rounded-t-lg mt-2 shadow-lg"></div>
                    </div>
                )}

                {/* 3rd Place (Bronze) */}
                {topThree[2] && (
                    <div className="flex flex-col items-center w-1/3 md:w-1/4">
                        <div className="relative mb-2">
                            <img src={topThree[2].avatar} alt={topThree[2].name} className="w-16 h-16 rounded-full border-4 border-orange-300 shadow-lg object-cover" />
                            <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                                <span className="bg-orange-400 text-white text-xs font-bold px-2 rounded-full border border-white">3</span>
                            </div>
                        </div>
                        <div className="font-bold text-gray-800 text-sm text-center truncate w-full">{topThree[2].name}</div>
                        <div className="text-xs text-gray-500 font-mono">{formatMetric(topThree[2][filter])}</div>
                        <div className="h-16 w-full bg-gradient-to-t from-orange-200 to-orange-100 rounded-t-lg mt-2 opacity-80"></div>
                    </div>
                )}
            </div>

            {/* List for the rest */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                {rest.map((rep, idx) => (
                    <div key={rep.id} className="flex items-center p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <div className="w-8 text-center font-bold text-gray-400 text-sm font-mono">#{idx + 4}</div>
                        <img src={rep.avatar} alt={rep.name} className="w-10 h-10 rounded-full border border-gray-200 mx-3 object-cover" />
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-800 text-sm">{rep.name}</h3>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-gray-700 text-sm font-mono">{formatMetric(rep[filter])}</p>
                        </div>
                    </div>
                ))}
                {rest.length === 0 && (
                    <div className="p-4 text-center text-gray-400 text-sm">
                        No other sales reps yet.
                    </div>
                )}
            </div>
        </div>
    );
}
