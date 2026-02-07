import { useState } from 'react';
import { trackingService } from '../../../services/trackingService';
import { formatDate } from '../../../lib/utils';

export default function TrackingPage() {
    const [awb, setAwb] = useState('');
    const [trackingData, setTrackingData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleTrack = async (e) => {
        e.preventDefault();
        if (!awb) return;

        setLoading(true);
        setSearched(true);
        setTrackingData(null);

        try {
            console.log('Searching for AWB (trimmed):', awb);
            const data = await trackingService.getHistory(awb);
            console.log('Fetch Result:', data);
            setTrackingData(data);
        } catch (error) {
            console.error('Error fetching tracking:', error);
            // Optional: User feedback handled by UI state
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <header className="mb-6 text-center md:text-left">
                <h1 className="text-2xl font-bold text-gray-900">Shipment Tracking</h1>
                <p className="text-gray-600">Real-time status updates</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Search Column */}
                <div className="card h-fit">
                    <div className="text-center mb-6">
                        <div className="bg-primary-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">📦</span>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Check Shipment Status</h2>
                        <p className="text-gray-500 text-sm">Enter your AWB / Receipt Number below</p>
                    </div>

                    <form onSubmit={handleTrack} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                className="input-field text-center text-lg tracking-wider uppercase font-mono"
                                placeholder="ATR-XXXXXXXX"
                                value={awb}
                                onChange={(e) => setAwb(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary w-full py-3 text-lg flex justify-center items-center"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                            ) : '🔍'}
                            Track Now
                        </button>
                    </form>

                    {/* External Link Fallback */}
                    <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-500 mb-2">Not finding what you're looking for?</p>
                        <a
                            href={`https://atrexinternational.com/track-shipment/?awb=${awb}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 text-sm hover:underline font-medium"
                        >
                            Check on Official ATR Express Website &rarr;
                        </a>
                    </div>
                </div>

                {/* Results Column */}
                <div>
                    {loading ? (
                        <div className="card flex items-center justify-center h-48">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    ) : searched && trackingData ? (
                        <div className="card">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                Status History
                                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-mono">{awb}</span>
                            </h3>

                            {trackingData.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">🤷‍♂️</div>
                                    <p className="text-gray-500">No internal tracking data found.</p>
                                    <p className="text-sm text-gray-400 mt-1">Please check the official website link/button.</p>
                                    <DebugRecentEvents />
                                </div>
                            ) : (
                                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                    {trackingData.map((event, index) => (
                                        <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            {/* Icon */}
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 group-first:bg-primary-600 group-first:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                                {index === 0 ? '📍' : '🚚'}
                                            </div>

                                            {/* Content */}
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-gray-200 shadow-sm bg-white">
                                                <div className="flex items-center justify-between space-x-2 mb-1">
                                                    <span className="font-bold text-gray-900">{event.status}</span>
                                                    <time className="font-mono text-xs text-gray-500 text-right">
                                                        {formatDate(event.occurred_at)}
                                                    </time>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {event.description}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {event.location}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 border-2 border-dashed border-gray-200 rounded-lg">
                            <span className="text-4xl mb-2">📡</span>
                            <p>Enter AWB to see tracking timeline</p>
                            <DebugRecentEvents />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function DebugRecentEvents() {
    const [events, setEvents] = useState([]);
    const [show, setShow] = useState(false);

    const loadEvents = async () => {
        const data = await trackingService.getRecentEventsDebug();
        setEvents(data || []);
        setShow(true);
    };

    if (!show) return <button onClick={loadEvents} className="text-xs text-gray-400 mt-4 underline">Debug: Show Latest DB Data</button>;

    return (
        <div className="mt-4 w-full text-left bg-gray-50 p-2 rounded text-xs">
            <strong>Latest 5 DB Entries:</strong>
            <pre className="mt-1 overflow-x-auto">{JSON.stringify(events, null, 2)}</pre>
        </div>
    );
}
