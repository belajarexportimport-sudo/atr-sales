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
        commission_approved: false,
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
                commission_approved: inquiry.commission_approved || false,
                status: inquiry.status || 'Profiling',
                shipment_date: inquiry.shipment_date || '',
                awb_number: inquiry.awb_number || '',
                awb_request_id: inquiry.awb_request_id || null,
            });
        }
    }, [inquiry]);

    // Auto-calculate commission when revenue or GP changes, BUT ONLY IF NOT APPROVED
    useEffect(() => {
        // If commission is already approved, DO NOT overwrite it with auto-calculation
        if (formData.commission_approved) return;

        const revenue = parseFloat(formData.est_revenue) || 0;
        const gp = parseFloat(formData.est_gp) || 0;
        const commission = calculateCommission(revenue, gp);

        setFormData(prev => ({
            ...prev,
            est_commission: commission
        }));
    }, [formData.est_revenue, formData.est_gp, formData.commission_approved]);

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

    // Approve Commission
    const handleApproveCommission = async () => {
        if (!inquiry?.id) {
            alert('❌ Please save the RFQ first');
            return;
        }

        if (!confirm(`Approve commission of ${formatCurrency(formData.est_commission)} for this RFQ?`)) {
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase.rpc('approve_commission', {
                p_inquiry_id: inquiry.id,
                p_approved_by: user.id
            });

            if (error) throw error;

            alert('✅ Commission approved! Sales can now see the amount.');

            // Refresh to show approved status
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Error approving commission:', err);
            alert('❌ Failed to approve commission: ' + err.message);
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

            let result;
            if (inquiry?.id) {
                // UPDATE existing inquiry
                console.log('Updating existing inquiry:', inquiry.id);
                result = await supabase
                    .from('inquiries')
                    .update(inquiryData)
                    .eq('id', inquiry.id)
                    .select();
            } else {
                // INSERT new inquiry
                console.log('Inserting new inquiry');
                result = await supabase
                    .from('inquiries')
                    .insert([inquiryData])
                    .select();
            }

            const { data, error: submitError } = result;

            if (submitError) throw submitError;

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
                <h1 className="text-2xl font-bold text-gray-100">New Inquiry</h1>
                <p className="text-gray-400">Create a new customer inquiry</p>
            </header>

            {error && (
                <div className="bg-red-900/40 border border-red-800 text-red-200 px-4 py-3 rounded-lg mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="card space-y-6">
                {/* Lead Info Badge */}
                {leadId && (
                    <div className="bg-blue-900/40 border border-blue-800 text-blue-200 px-4 py-3 rounded-lg flex items-center gap-2">
                        <span className="text-xl">ℹ️</span> This RFQ is linked to an existing lead. Customer information is pre-filled and locked.
                    </div>
                )}

                {/* Customer Information */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-200 border-b border-gray-700 pb-2">Customer Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Customer Name *</label>
                            <input
                                type="text"
                                name="customer_name"
                                className={`input-field ${leadId ? 'bg-gray-300 text-gray-900 border-gray-400 cursor-not-allowed font-medium' : ''}`}
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
                                className={`input-field ${leadId ? 'bg-gray-300 text-gray-900 border-gray-400 cursor-not-allowed font-medium' : ''}`}
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
                                className={`input-field ${leadId ? 'bg-gray-300 text-gray-900 border-gray-400 cursor-not-allowed font-medium' : ''}`}
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
                                className={`input-field ${leadId ? 'bg-gray-300 text-gray-900 border-gray-400 cursor-not-allowed font-medium' : ''}`}
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
                                className={`input-field ${leadId ? 'bg-gray-300 text-gray-900 border-gray-400 cursor-not-allowed font-medium' : ''}`}
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
                    <h3 className="text-lg font-semibold mb-4 text-gray-200 border-b border-gray-700 pb-2">Shipment Information</h3>
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
                                    <span className="px-3 py-2 bg-yellow-900/40 border border-yellow-700 text-yellow-500 text-sm font-medium rounded-md">
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
                    <h3 className="text-lg font-semibold mb-4 text-gray-200 border-b border-gray-700 pb-2">Financial Information</h3>
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

                        {/* Commission - Editable for Admin, Read-Only for Sales */}
                        <div className="relative">
                            <label className="label flex items-center gap-2">
                                <span>💰 Your Commission</span>
                                {formData.commission_approved && (
                                    <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-[10px] font-bold uppercase rounded-full shadow-lg border border-yellow-400">
                                        ✓ APPROVED
                                    </span>
                                )}
                            </label>

                            {profile?.role === 'admin' ? (
                                // Admin View: Editable Number Input
                                <div className="space-y-2">
                                    <div className="relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-400 sm:text-sm">Rp</span>
                                        </div>
                                        <input
                                            type="number"
                                            name="est_commission"
                                            className="input-field pl-10 bg-secondary-800 border-yellow-600 text-yellow-500 font-bold text-lg focus:ring-yellow-500 focus:border-yellow-500"
                                            placeholder="0"
                                            value={formData.est_commission}
                                            onChange={handleChange}
                                            step="500"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                                        <span className="text-yellow-500/80">Formula (Active): GP × 2% = {formatCurrency(formData.est_gp * 0.02)}</span>
                                        {!formData.commission_approved && formData.est_commission > 0 && isEditMode && (
                                            <button
                                                type="button"
                                                onClick={handleApproveCommission}
                                                className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold rounded-lg hover:from-yellow-400 hover:to-amber-500 shadow-lg shadow-yellow-900/50 transition-all text-xs"
                                            >
                                                ✓ Approve
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                // Sales View: Read-Only Formatted
                                <div>
                                    {formData.commission_approved ? (
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="input-field bg-gradient-to-r from-secondary-800 to-secondary-900 border-2 border-yellow-600 text-yellow-500 font-bold text-lg shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                                                value={formatCurrency(formData.est_commission)}
                                                disabled
                                                readOnly
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500">
                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                                </svg>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="input-field bg-secondary-800 border-2 border-dashed border-gray-600 text-gray-400 italic"
                                                value="⏳ Pending Admin Approval"
                                                disabled
                                                readOnly
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
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
