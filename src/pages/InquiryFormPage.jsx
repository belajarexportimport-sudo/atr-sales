import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { calculateCommission, formatCurrency } from '../lib/utils';

export default function InquiryFormPage({ lead, inquiry, onSuccess }) {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [leadId, setLeadId] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({
        customer_name: '',
        pic: '',
        industry: '',
        phone: '',
        email: '',
        origin: '',
        destination: '',
        weight: '',
        dimension: '',
        service_type: 'Air Freight',
        est_revenue: '',
        est_gp: '',
        est_commission: 0,
        status: 'Profiling',
        shipment_date: '',
        awb_number: '',
        awb_request_id: null,
    });

    // Pre-fill customer data from lead if provided
    useEffect(() => {
        if (lead) {
            setLeadId(lead.id);
            setFormData(prev => ({
                ...prev,
                customer_name: lead.company_name || '',
                pic: lead.pic_name || '',
                phone: lead.phone || '',
                email: lead.email || '',
                industry: lead.industry || '',
            }));
        }
    }, [lead]);

    // Pre-fill all data from inquiry if editing
    useEffect(() => {
        if (inquiry) {
            setIsEditMode(true);
            setLeadId(inquiry.lead_id);
            setFormData({
                customer_name: inquiry.customer_name || '',
                pic: inquiry.pic || '',
                industry: inquiry.industry || '',
                phone: inquiry.phone || '',
                email: inquiry.email || '',
                origin: inquiry.origin || '',
                destination: inquiry.destination || '',
                weight: inquiry.weight || '',
                dimension: inquiry.dimension || '',
                service_type: inquiry.service_type || 'Air Freight',
                est_revenue: inquiry.est_revenue || '',
                est_gp: inquiry.est_gp || '',
                est_commission: inquiry.est_commission || 0,
                status: inquiry.status || 'Profiling',
                shipment_date: inquiry.shipment_date || '',
                awb_number: inquiry.awb_number || '',
                awb_request_id: inquiry.awb_request_id || null,
            });
        }
    }, [inquiry]);

    // Auto-calculate commission when revenue or GP changes
    useEffect(() => {
        const revenue = parseFloat(formData.est_revenue) || 0;
        const gp = parseFloat(formData.est_gp) || 0;
        const commission = calculateCommission(revenue, gp);

        setFormData(prev => ({
            ...prev,
            est_commission: commission
        }));
    }, [formData.est_revenue, formData.est_gp]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Request AWB Number
    const handleRequestAWB = async () => {
        if (!inquiry?.id) {
            alert('❌ Please save the RFQ first before requesting AWB');
            return;
        }

        if (!profile?.initials) {
            alert('❌ Your profile is missing initials. Please contact admin.');
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase.rpc('request_awb', {
                p_inquiry_id: inquiry.id,
                p_sales_rep_id: user.id,
                p_sales_initial: profile.initials
            });

            if (error) throw error;

            alert('✅ AWB request submitted! Admin will approve shortly.');

            // Refresh to show pending badge
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Error requesting AWB:', err);
            alert('❌ Failed to request AWB: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Find or create lead
    const findOrCreateLead = async () => {
        // If we already have a lead_id (from pre-filled lead), use it
        if (leadId) {
            return leadId;
        }

        // Check if lead exists for this sales user (by email or phone)
        if (formData.email || formData.phone) {
            const { data: existingLead } = await supabase
                .from('leads')
                .select('id')
                .eq('user_id', user.id)
                .or(`email.eq.${formData.email || 'null'},phone.eq.${formData.phone || 'null'}`)
                .maybeSingle();

            if (existingLead) {
                return existingLead.id;
            }
        }

        // Create new lead
        console.log('Creating new lead for:', formData.customer_name);
        const { data: newLead, error: leadError } = await supabase
            .from('leads')
            .insert([{
                user_id: user.id,
                company_name: formData.customer_name,
                pic_name: formData.pic || null,
                phone: formData.phone || null,
                email: formData.email || null,
                industry: formData.industry || null,
                status: 'Hot', // Auto-set to Hot since they have RFQ
            }])
            .select()
            .single();

        console.log('Lead Creation Result:', newLead, leadError);

        if (leadError) throw leadError;
        return newLead.id;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Find or create lead first
            const finalLeadId = await findOrCreateLead();

            // Prepare data for Supabase
            const inquiryData = {
                lead_id: finalLeadId,
                user_id: user.id,
                customer_name: formData.customer_name,
                pic: formData.pic || null,
                industry: formData.industry || null,
                phone: formData.phone || null,
                email: formData.email || null,
                origin: formData.origin,
                destination: formData.destination,
                weight: formData.weight ? parseFloat(formData.weight) : null,
                dimension: formData.dimension || null,
                service_type: formData.service_type || null,
                est_revenue: formData.est_revenue ? parseFloat(formData.est_revenue) : null,
                est_gp: formData.est_gp ? parseFloat(formData.est_gp) : null,
                est_commission: formData.est_commission,
                status: formData.status,
                shipment_date: formData.shipment_date || null,
                awb_number: formData.awb_number || null,
            };

            const { data, error: insertError } = await supabase
                .from('inquiries')
                .insert([inquiryData])
                .select();

            if (insertError) throw insertError;

            // Success! Redirect to dashboard
            alert('Inquiry saved successfully!');
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Error saving inquiry:', err);
            setError(err.message || 'Failed to save inquiry');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">New Inquiry</h1>
                <p className="text-gray-600">Create a new customer inquiry</p>
            </header>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="card space-y-6">
                {/* Lead Info Badge */}
                {leadId && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                        ℹ️ This RFQ is linked to an existing lead. Customer information is pre-filled and locked.
                    </div>
                )}

                {/* Customer Information */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Customer Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Customer Name *</label>
                            <input
                                type="text"
                                name="customer_name"
                                className={`input-field ${leadId ? 'bg-gray-100' : ''}`}
                                placeholder="PT. Example Company"
                                value={formData.customer_name}
                                onChange={handleChange}
                                disabled={!!leadId}
                                readOnly={!!leadId}
                                required
                            />
                        </div>

                        <div>
                            <label className="label">PIC Name</label>
                            <input
                                type="text"
                                name="pic"
                                className={`input-field ${leadId ? 'bg-gray-100' : ''}`}
                                placeholder="John Doe"
                                value={formData.pic}
                                onChange={handleChange}
                                disabled={!!leadId}
                                readOnly={!!leadId}
                            />
                        </div>

                        <div>
                            <label className="label">Industry</label>
                            <input
                                type="text"
                                name="industry"
                                className={`input-field ${leadId ? 'bg-gray-100' : ''}`}
                                placeholder="Manufacturing"
                                value={formData.industry}
                                onChange={handleChange}
                                disabled={!!leadId}
                                readOnly={!!leadId}
                            />
                        </div>

                        <div>
                            <label className="label">Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                className={`input-field ${leadId ? 'bg-gray-100' : ''}`}
                                placeholder="+62 812 3456 7890"
                                value={formData.phone}
                                onChange={handleChange}
                                disabled={!!leadId}
                                readOnly={!!leadId}
                            />
                        </div>

                        <div>
                            <label className="label">Email</label>
                            <input
                                type="email"
                                name="email"
                                className={`input-field ${leadId ? 'bg-gray-100' : ''}`}
                                placeholder="contact@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={!!leadId}
                                readOnly={!!leadId}
                            />
                        </div>

                        <div>
                            <label className="label">Status *</label>
                            <select
                                name="status"
                                className="input-field"
                                value={formData.status}
                                onChange={handleChange}
                                required
                            >
                                <option>Profiling</option>
                                <option>Proposal</option>
                                <option>Negotiation</option>
                                <option>Won</option>
                                <option>Lost</option>
                                <option>Invoiced</option>
                                <option>Paid</option>
                                <option>Overdue</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Shipment Information */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Shipment Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Origin *</label>
                            <input
                                type="text"
                                name="origin"
                                className="input-field"
                                placeholder="Jakarta"
                                value={formData.origin}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Destination *</label>
                            <input
                                type="text"
                                name="destination"
                                className="input-field"
                                placeholder="Singapore"
                                value={formData.destination}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Weight (kg)</label>
                            <input
                                type="number"
                                name="weight"
                                className="input-field"
                                placeholder="100"
                                value={formData.weight}
                                onChange={handleChange}
                                step="0.01"
                            />
                        </div>

                        <div>
                            <label className="label">Dimension (cm)</label>
                            <input
                                type="text"
                                name="dimension"
                                className="input-field"
                                placeholder="50x40x30"
                                value={formData.dimension}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="label">Service Type</label>
                            <select
                                name="service_type"
                                className="input-field"
                                value={formData.service_type}
                                onChange={handleChange}
                            >
                                <option>Air Freight</option>
                                <option>Sea Freight</option>
                                <option>Express</option>
                                <option>Trucking</option>
                                <option>Warehouse</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">Shipment Date</label>
                            <input
                                type="date"
                                name="shipment_date"
                                className="input-field"
                                value={formData.shipment_date}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="label">AWB Number</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    name="awb_number"
                                    className="input-field flex-1"
                                    placeholder="ATR-2026-001-AD"
                                    value={formData.awb_number}
                                    onChange={handleChange}
                                    readOnly
                                />

                                {/* Request AWB Button - for sales without AWB */}
                                {!formData.awb_number && !inquiry?.awb_request_id && isEditMode && (
                                    <button
                                        type="button"
                                        onClick={handleRequestAWB}
                                        className="px-4 py-2 border border-primary-600 text-primary-600 shadow-sm text-sm font-medium rounded-md hover:bg-primary-50"
                                        title="Request AWB Number from Admin"
                                    >
                                        📦 Request AWB
                                    </button>
                                )}

                                {/* Pending Badge - when request is pending */}
                                {!formData.awb_number && inquiry?.awb_request_id && (
                                    <span className="px-3 py-2 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-md">
                                        ⏳ AWB Pending
                                    </span>
                                )}

                                {/* Track Button - when AWB exists */}
                                {formData.awb_number && (
                                    <a
                                        href={`https://atrexinternational.com/track-shipment/?awb=${formData.awb_number}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                    >
                                        🌍 Track
                                    </a>
                                )}
                            </div>
                            {!formData.awb_number && !isEditMode && (
                                <p className="text-xs text-gray-500 mt-1">Save RFQ first to request AWB number</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Financial Information */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Financial Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="label">Est. Revenue (IDR)</label>
                            <input
                                type="number"
                                name="est_revenue"
                                className="input-field"
                                placeholder="1000000"
                                value={formData.est_revenue}
                                onChange={handleChange}
                                step="1000"
                            />
                        </div>

                        {/* GP - Admin Only */}
                        {profile?.role === 'admin' && (
                            <div>
                                <label className="label">Est. GP (IDR)</label>
                                <input
                                    type="number"
                                    name="est_gp"
                                    className="input-field"
                                    placeholder="200000"
                                    value={formData.est_gp}
                                    onChange={handleChange}
                                    step="1000"
                                />
                            </div>
                        )}

                        {/* Commission - Admin Only */}
                        {profile?.role === 'admin' && (
                            <div>
                                <label className="label">Est. Commission (Auto)</label>
                                <input
                                    type="text"
                                    className="input-field bg-gray-100"
                                    value={formatCurrency(formData.est_commission)}
                                    disabled
                                    readOnly
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Formula: (Revenue - GP) × 2%
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                        type="submit"
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : '💾 Save Inquiry'}
                    </button>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => onSuccess && onSuccess()}
                        disabled={loading}
                    >
                        ❌ Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
