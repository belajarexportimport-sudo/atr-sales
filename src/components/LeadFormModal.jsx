import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function LeadFormModal({ lead, onClose }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [duplicateWarning, setDuplicateWarning] = useState('');
    const [checkingDuplicate, setCheckingDuplicate] = useState(false);

    const [formData, setFormData] = useState({
        company_name: '',
        pic_name: '',
        phone: '',
        email: '',
        industry: '',
        status: 'Cold',
        notes: '',
    });

    useEffect(() => {
        if (lead) {
            setFormData({
                company_name: lead.company_name || '',
                pic_name: lead.pic_name || '',
                phone: lead.phone || '',
                email: lead.email || '',
                industry: lead.industry || '',
                status: lead.status || 'Cold',
                notes: lead.notes || '',
                risk_potential: lead.risk_potential || null, // Load existing risk
            });
            if (lead.risk_potential) setRiskPotential(lead.risk_potential);
        }
    }, [lead]);

    // Check for duplicate company name
    useEffect(() => {
        const checkDuplicate = async () => {
            // Skip check if editing existing lead or company name is empty
            if (lead || !formData.company_name || formData.company_name.length < 2) {
                setDuplicateWarning('');
                return;
            }

            setCheckingDuplicate(true);
            try {
                const { data, error } = await supabase
                    .from('leads')
                    .select('id, company_name')
                    .eq('user_id', user.id)
                    .ilike('company_name', formData.company_name)
                    .limit(1);

                if (error) throw error;

                if (data && data.length > 0) {
                    setDuplicateWarning(`⚠️ Company "${data[0].company_name}" already exists in your leads`);
                } else {
                    setDuplicateWarning('');
                }
            } catch (err) {
                console.error('Error checking duplicate:', err);
            } finally {
                setCheckingDuplicate(false);
            }
        };

        // Debounce the check (wait 500ms after user stops typing)
        const timeoutId = setTimeout(checkDuplicate, 500);
        return () => clearTimeout(timeoutId);
    }, [formData.company_name, user.id, lead]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const leadData = {
                user_id: user.id,
                company_name: formData.company_name,
                pic_name: formData.pic_name || null,
                phone: formData.phone || null,
                email: formData.email || null,
                industry: formData.industry || null,
                status: formData.status,
                notes: formData.notes || null,
                risk_potential: formData.risk_potential || null, // Include Risk Potential
            };

            if (lead) {
                // Update existing lead
                const { error: updateError } = await supabase
                    .from('leads')
                    .update(leadData)
                    .eq('id', lead.id);

                if (updateError) throw updateError;
            } else {
                // Create new lead
                const { error: insertError } = await supabase
                    .from('leads')
                    .insert([leadData]);

                if (insertError) throw insertError;
            }

            onClose(true); // Close and refresh
        } catch (err) {
            console.error('Error saving lead:', err);
            setError(err.message || 'Failed to save lead');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">
                            {lead ? 'Edit Lead' : 'New Lead'}
                        </h2>
                        <button
                            onClick={() => onClose(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    {duplicateWarning && (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
                            {duplicateWarning}
                            <p className="text-sm mt-1">You can still save if this is a different company with the same name.</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="label">
                                    Company Name *
                                    {checkingDuplicate && (
                                        <span className="ml-2 text-xs text-gray-500">Checking...</span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    name="company_name"
                                    className={`input-field ${duplicateWarning ? 'border-yellow-400' : ''}`}
                                    placeholder="PT. Example Company"
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">PIC Name</label>
                                <input
                                    type="text"
                                    name="pic_name"
                                    className="input-field"
                                    placeholder="John Doe"
                                    value={formData.pic_name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="label">Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="input-field"
                                    placeholder="+62 812 3456 7890"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="label">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="input-field"
                                    placeholder="contact@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="label">Industry</label>
                                <input
                                    type="text"
                                    name="industry"
                                    className="input-field"
                                    placeholder="Manufacturing"
                                    value={formData.industry}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="label">Status *</label>
                                <select
                                    name="status"
                                    className="input-field"
                                    value={formData.status}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="Cold">Cold</option>
                                    <option value="Warm">Warm</option>
                                    <option value="Hot">Hot</option>
                                    <option value="Closed-Won">Closed-Won</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="label">Notes</label>
                                <textarea
                                    name="notes"
                                    className="input-field"
                                    placeholder="Additional notes about this lead..."
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows="3"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                            <button
                                type="submit"
                                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : '💾 Save Lead'}
                            </button>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => onClose(false)}
                                disabled={loading}
                            >
                                ❌ Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
