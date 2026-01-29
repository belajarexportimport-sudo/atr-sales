import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
                <p className="text-gray-600">Manual Shipment Status Updates</p>
            </header>

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
