import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { useModal } from '../../../contexts/ModalContext'; // Import Modal
import { calculateCommission, formatCurrency } from '../../../lib/utils';
import { inquiryService } from '../../../services/inquiryService';
import { commissionService } from '../../../services/commissionService';
import { leadService } from '../../../services/leadService'; import { supabase } from '../../../lib/supabase';
import ShipperForm from '../components/ShipperForm';
import ConsigneeForm from '../components/ConsigneeForm';

export default function InquiryFormPage({ lead, inquiry, onSuccess, onQuote, onPrintInvoice }) {
    const { user, profile } = useAuth();
    const { showToast } = useToast();
    const { showConfirm } = useModal(); // Hook
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [leadId, setLeadId] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isOpenMarket, setIsOpenMarket] = useState(false); // NEW: Admin Inject
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
        packages: [{ weight: '', length: '', width: '', height: '', cwt: '', type: 'Box', commodity: '' }],

        // Detailed Shipper & Consignee
        shipper_name: '',
        shipper_pic: '',
        shipper_address: '',
        shipper_city: '',
        shipper_postal_code: '',
        shipper_phone: '',
        shipper_email: '',
        consignee_name: '',
        consignee_pic: '',
        consignee_address: '',
        consignee_city: '',
        consignee_postal_code: '',
        consignee_phone: '',
        consignee_email: ''
    });

    // Helper: Add Package
    const addPackage = () => {
        setFormData(prev => ({
            ...prev,
            packages: [...prev.packages, { weight: '', length: '', width: '', height: '', cwt: '', type: 'Box', commodity: '' }]
        }));
    };

    // Helper: Remove Package
    const removePackage = (index) => {
        setFormData(prev => ({
            ...prev,
            packages: prev.packages.filter((_, i) => i !== index)
        }));
    };

    // Helper: Handle Package Change
    const handlePackageChange = (index, field, value) => {
        setFormData(prev => {
            const newPackages = [...prev.packages];
            newPackages[index] = { ...newPackages[index], [field]: value };
            return { ...prev, packages: newPackages };
        });
    };

    // Helper: Calculate Total Weight
    const calculateTotalWeight = () => {
        return formData.packages.reduce((sum, pkg) => sum + (parseFloat(pkg.weight) || 0), 0);
    };

    // Pre-fill Logic
    useEffect(() => {
        if (lead) {
            setLeadId(lead.id);
            setFormData(prev => ({
                ...prev,
                customer_name: lead.company_name,
                pic: lead.pic_name,
                phone: lead.phone,
                email: lead.email,
                industry: lead.industry
            }));
        }

        if (inquiry) {
            setIsEditMode(true);
            setLeadId(inquiry.lead_id);
            const isApproved = inquiry.commission_status === 'Approved' || inquiry.commission_approved === true;
            const commissionValue = isApproved
                ? (inquiry.commission_amount || inquiry.est_commission || 0)
                : (inquiry.est_commission || 0);

            // Backwards compatibility: if inquiry.packages is missing, use weight/dim from root cols
            // Also parse legacy "dimension" string "10x10x10" -> length, width, height
            const parseDim = (dimStr) => {
                if (!dimStr) return { length: '', width: '', height: '' };
                const parts = dimStr.toLowerCase().split('x');
                return {
                    length: parts[0] || '',
                    width: parts[1] || '',
                    height: parts[2] || ''
                };
            };

            const existingPackages = inquiry.packages && inquiry.packages.length > 0
                ? inquiry.packages.map(p => ({
                    ...p,
                    // If new fields missing but dimension exists, parse it
                    ...(!p.length && p.dimension ? parseDim(p.dimension) : {})
                }))
                : [{
                    weight: inquiry.weight || '',
                    ...parseDim(inquiry.dimension),
                    cwt: '', // Default empty for old data
                    type: inquiry.package_type || 'Box',
                    commodity: inquiry.commodity || ''
                }];

            setFormData({
                customer_name: inquiry.customer_name || '',
                pic: inquiry.pic || '',
                industry: inquiry.industry || '',
                phone: inquiry.phone || '',
                email: inquiry.email || '',
                origin: inquiry.origin || '',
                destination: inquiry.destination || '',
                // Legacy fields (kept for API compatibility but UI uses packages)
                weight: inquiry.weight || '',
                dimension: inquiry.dimension || '',
                service_type: inquiry.service_type || 'Air Freight',
                est_revenue: inquiry.est_revenue || '',
                est_gp: inquiry.est_gp || '',
                est_commission: commissionValue,
                commission_approved: isApproved,
                status: inquiry.status || 'Profiling',
                shipment_date: inquiry.shipment_date || '',
                awb_number: inquiry.awb_number || '',
                awb_request_id: inquiry.awb_request_id || null,
                packages: existingPackages,

                // Map DB columns to State
                shipper_name: inquiry.shipper_name || '',
                shipper_pic: inquiry.shipper_pic || '',
                shipper_address: inquiry.shipper_address || '',
                shipper_city: inquiry.shipper_city || '',
                shipper_postal_code: inquiry.shipper_postal_code || '',
                shipper_phone: inquiry.shipper_phone || '',
                shipper_email: inquiry.shipper_email || '',

                consignee_name: inquiry.consignee_name || '',
                consignee_pic: inquiry.consignee_pic || '',
                consignee_address: inquiry.consignee_address || '',
                consignee_city: inquiry.consignee_city || '',
                consignee_postal_code: inquiry.consignee_postal_code || '',
                consignee_phone: inquiry.consignee_phone || '',
                consignee_email: inquiry.consignee_email || ''
            });
        }
    }, [lead, inquiry]);

    // Auto-calculate commission (Formula: GP * 2%)
    useEffect(() => {
        // Removed: commission_approved check (Always calculate based on formula)
        const revenue = parseFloat(formData.est_revenue) || 0;
        const gp = parseFloat(formData.est_gp) || 0;
        const commission = commissionService.calculate(revenue, gp);
        setFormData(prev => ({ ...prev, est_commission: commission }));
    }, [formData.est_revenue, formData.est_gp]); // Removed commission_approved dependency

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Request AWB Number
    const handleRequestAWB = async () => {
        if (!inquiry?.id) return showToast('❌ Please save the RFQ first before requesting AWB', 'error');
        if (!profile?.initials) return showToast('❌ Your profile is missing initials.', 'error');

        try {
            setLoading(true);
            // Use sales_code if available, otherwise initials, otherwise fallback to 'XX'
            const identifier = profile.sales_code || profile.initials || 'XX';
            await inquiryService.requestAWB(inquiry.id, user.id, identifier);
            showToast('✅ AWB request submitted! Admin will approve shortly.', 'success');
            if (onSuccess) onSuccess();
        } catch (err) {
            showToast('❌ Failed to request AWB: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Removed: handleApproveCommission (Approval workflow deleted)

    // Handlers for Modular Forms
    const handleCopyCustomerToConsignee = () => {
        setFormData(prev => ({
            ...prev,
            consignee_name: prev.customer_name,
            consignee_pic: prev.pic,
            consignee_phone: prev.phone,
            consignee_email: prev.email,
            consignee_city: prev.destination,
            consignee_postal_code: prev.destination_postal_code
        }));
        showToast('Info copied from Customer/Destination', 'success');
    };

    const handleCopyCustomerToShipper = () => {
        setFormData(prev => ({
            ...prev,
            shipper_name: prev.customer_name,
            shipper_pic: prev.pic,
            shipper_phone: prev.phone,
            shipper_email: prev.email,
            shipper_city: prev.origin,
            shipper_postal_code: prev.origin_postal_code
        }));
        showToast('Info copied from Customer/Origin', 'success');
    };

    const handleClearShipper = () => {
        setFormData(prev => ({
            ...prev,
            shipper_name: '', shipper_pic: '', shipper_address: '', shipper_city: '', shipper_postal_code: '', shipper_phone: '', shipper_email: ''
        }));
    };

    const handleClearConsignee = () => {
        setFormData(prev => ({
            ...prev,
            consignee_name: '', consignee_pic: '', consignee_address: '', consignee_city: '', consignee_postal_code: '', consignee_phone: '', consignee_email: ''
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const leadData = {
                customer_name: formData.customer_name,
                pic: formData.pic,
                phone: formData.phone,
                email: formData.email,
                industry: formData.industry,
            };
            const finalLeadId = await leadService.findOrCreate(user, leadData);

            const inquiryData = {
                lead_id: finalLeadId,
                // OPEN MARKET LOGIC: If Admin checks 'isOpenMarket', user_id is NULL
                user_id: (profile?.role === 'admin' && isOpenMarket) ? null : user.id,
                customer_name: formData.customer_name,
                pic: formData.pic || null,
                industry: formData.industry || null,
                phone: formData.phone || null,
                email: formData.email || null,
                origin: formData.origin,
                destination: formData.destination,
                // Automatically sum weight from packages for root column
                weight: calculateTotalWeight(),
                // Use first package dim as primary specific or join them
                dimension: formData.packages.map(p => `${p.length || 0}x${p.width || 0}x${p.height || 0}`).join('; '),
                service_type: formData.service_type || null,
                est_revenue: formData.est_revenue ? parseFloat(String(formData.est_revenue).replace(/[^0-9.-]+/g, '')) : null,
                est_gp: formData.est_gp ? parseFloat(String(formData.est_gp).replace(/[^0-9.-]+/g, '')) : null,
                est_commission: formData.est_commission ? parseFloat(String(formData.est_commission).replace(/[^0-9.-]+/g, '')) : 0,
                // OPEN MARKET LOGIC: If Open Market, Status is Profiling (unassigned to user)
                status: (profile?.role === 'admin' && isOpenMarket) ? 'Profiling' : formData.status,
                shipment_date: formData.shipment_date || null,
                awb_number: formData.awb_number || null,
                packages: formData.packages, // Save full structure to JSONB

                // Detailed Shipper & Consignee
                shipper_name: formData.shipper_name || null,
                shipper_pic: formData.shipper_pic || null,
                shipper_address: formData.shipper_address || null,
                shipper_city: formData.shipper_city || null,
                shipper_postal_code: formData.shipper_postal_code || null,
                shipper_phone: formData.shipper_phone || null,
                shipper_email: formData.shipper_email || null,

                consignee_name: formData.consignee_name || null,
                consignee_pic: formData.consignee_pic || null,
                consignee_address: formData.consignee_address || null,
                consignee_city: formData.consignee_city || null,
                consignee_postal_code: formData.consignee_postal_code || null,
                consignee_phone: formData.consignee_phone || null,
                consignee_email: formData.consignee_email || null
            };

            console.log('🚀 DEBUG: Submitting Inquiry Payload:', inquiryData); // ADDED FOR DEBUGGING

            if (inquiry?.id) {
                console.log('🚀 UPDATE MODE - Direct API Call');

                // DIRECT UPDATE via fetch API (bypass all cache)
                const response = await fetch(`https://ewquycutqbtagjlokvyn.supabase.co/rest/v1/inquiries?id=eq.${inquiry.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3cXV5Y3V0cWJ0YWdqbG9rdnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MTI3MjYsImV4cCI6MjA4NTE4ODcyNn0.FhdCAcK7nxIUk7zdoqxX9xyrjCslBUPXRBiWgugXu3s',
                        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(inquiryData)
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to update inquiry');
                }

                const result = await response.json();
                console.log('✅ DIRECT UPDATE SUCCESS:', result);
            } else {
                await inquiryService.create(inquiryData, profile?.role);
            }

            showToast('✅ Inquiry saved successfully!', 'success');
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Error saving inquiry:', err);
            setError(err.message || 'Failed to save inquiry');
            showToast('❌ Failed to save inquiry', 'error', err.message || err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-100">New Inquiry (v3.9 Fix)</h1>
                    <p className="text-gray-400">Create a new customer inquiry</p>
                </div>
                <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${profile?.role === 'admin' ? 'bg-red-900 text-red-200' : 'bg-gray-700 text-gray-300'}`}>
                        ROLE: {profile?.role || 'NONE'}
                    </span>
                </div>
            </header>

            {error && (
                <div className="bg-red-900/40 border border-red-800 text-red-200 px-4 py-3 rounded-lg mb-4">
                    {error}
                </div>
            )}

            {/* ADMIN ONLY: Inject to Open Market Toggle (Release to Shark Tank) */}
            {profile?.role === 'admin' && (
                <div className="bg-indigo-900/30 border border-indigo-700/50 p-4 rounded-lg mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-indigo-200 font-bold flex items-center gap-2">🦈 Shark Tank Inject</h3>
                        <p className="text-xs text-indigo-300/70">Post this RFQ to the Open Market for any sales to grab.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={isOpenMarket} onChange={(e) => setIsOpenMarket(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        <span className="ml-3 text-sm font-medium text-indigo-300 font-bold">{isOpenMarket ? 'YES' : 'NO'}</span>
                    </label>
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
                        {/* ... Rest of inputs identical to previous version ... */}
                        <div>
                            <label className="label">PIC Name</label>
                            <input type="text" name="pic" className={`input-field ${leadId ? 'bg-gray-300 text-gray-900 border-gray-400 cursor-not-allowed font-medium' : ''}`} placeholder="John Doe" value={formData.pic} onChange={handleChange} disabled={!!leadId} readOnly={!!leadId} />
                        </div>
                        <div>
                            <label className="label">Industry</label>
                            <input type="text" name="industry" className={`input-field ${leadId ? 'bg-gray-300 text-gray-900 border-gray-400 cursor-not-allowed font-medium' : ''}`} placeholder="Manufacturing" value={formData.industry} onChange={handleChange} disabled={!!leadId} readOnly={!!leadId} />
                        </div>
                        <div>
                            <label className="label">Phone</label>
                            <input type="tel" name="phone" className={`input-field ${leadId ? 'bg-gray-300 text-gray-900 border-gray-400 cursor-not-allowed font-medium' : ''}`} placeholder="+62 812 3456 7890" value={formData.phone} onChange={handleChange} disabled={!!leadId} readOnly={!!leadId} />
                        </div>
                        <div>
                            <label className="label">Email</label>
                            <input type="email" name="email" className={`input-field ${leadId ? 'bg-gray-300 text-gray-900 border-gray-400 cursor-not-allowed font-medium' : ''}`} placeholder="contact@example.com" value={formData.email} onChange={handleChange} disabled={!!leadId} readOnly={!!leadId} />
                        </div>
                        <div>
                            <label className="label">Status *</label>
                            <select name="status" className="input-field" value={formData.status} onChange={handleChange} required>
                                <option>Profiling</option>
                                <option>Proposal</option>
                                <option>Negotiation</option>
                                <option>Won</option>
                                <option>Won - Verification at WHS</option>
                                <option>Lost</option>
                                {profile?.is_admin && <option>Invoiced</option>}
                                {profile?.is_admin && <option>Paid</option>}
                                {profile?.is_admin && <option>Overdue</option>}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Shipper & Consignee Modular Forms */}
                <ShipperForm
                    formData={formData}
                    handleChange={handleChange}
                    handleCopyFromCustomer={handleCopyCustomerToShipper}
                    handleClear={handleClearShipper}
                />

                <ConsigneeForm
                    formData={formData}
                    handleChange={handleChange}
                    handleCopyFromCustomer={handleCopyCustomerToConsignee}
                    handleClear={handleClearConsignee}
                />

                {/* Shipment Information */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-200 border-b border-gray-700 pb-2">Shipment Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Origin City *</label>
                                    <input type="text" name="origin" className="input-field" placeholder="Jakarta" value={formData.origin} onChange={handleChange} required />
                                </div>
                                <div>
                                    <label className="label">Origin Zip</label>
                                    <input type="text" name="origin_postal_code" className="input-field" placeholder="12345" value={formData.origin_postal_code || ''} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div>
                                    <label className="label">Destination City *</label>
                                    <input type="text" name="destination" className="input-field" placeholder="Singapore" value={formData.destination} onChange={handleChange} required />
                                </div>
                                <div>
                                    <label className="label">Dest Zip</label>
                                    <input type="text" name="destination_postal_code" className="input-field" placeholder="54321" value={formData.destination_postal_code || ''} onChange={handleChange} />
                                </div>
                            </div>
                            <div>
                                <label className="label">Service Type</label>
                                <select name="service_type" className="input-field" value={formData.service_type} onChange={handleChange}>
                                    <option>Air Freight</option>
                                    <option>Sea Freight</option>
                                    <option>Express</option>
                                    <option>Trucking</option>
                                    <option>Warehouse</option>
                                    <option>DOMESTIC</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Shipment Date</label>
                                <input type="date" name="shipment_date" className="input-field" value={formData.shipment_date} onChange={handleChange} />
                            </div>
                        </div>

                        {/* Shipper & Consignee Information (Critical for AWB) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                            <div className="bg-secondary-900/50 p-3 rounded-lg border border-gray-700">
                                <h4 className="text-sm font-bold text-gray-300 uppercase mb-2 border-b border-gray-600 pb-1">📤 Shipper Details</h4>
                                <div className="space-y-2">
                                    <input type="text" name="shipper_name" className="input-field text-sm" placeholder="Shipper Name" value={formData.shipper_name || ''} onChange={handleChange} />
                                    <input type="text" name="shipper_phone" className="input-field text-sm" placeholder="Phone" value={formData.shipper_phone || ''} onChange={handleChange} />
                                    <textarea name="shipper_address" className="input-field text-sm h-16 resize-none" placeholder="Address..." value={formData.shipper_address || ''} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="bg-secondary-900/50 p-3 rounded-lg border border-gray-700">
                                <h4 className="text-sm font-bold text-gray-300 uppercase mb-2 border-b border-gray-600 pb-1">📥 Consignee Details</h4>
                                <div className="space-y-2">
                                    <input type="text" name="consignee_name" className="input-field text-sm" placeholder="Consignee Name" value={formData.consignee_name || ''} onChange={handleChange} />
                                    <input type="text" name="consignee_phone" className="input-field text-sm" placeholder="Phone" value={formData.consignee_phone || ''} onChange={handleChange} />
                                    <textarea name="consignee_address" className="input-field text-sm h-16 resize-none" placeholder="Address..." value={formData.consignee_address || ''} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        {/* Multi-Collie Packages Section */}
                        <div className="mt-4 border border-gray-700 rounded-lg p-3 bg-secondary-900/30">
                            <label className="label mb-2 flex justify-between">
                                <span>📦 Packages ({formData.packages.length} items)</span>
                                <div className="text-right">
                                    <span className="text-primary-400 text-xs font-normal block">Total Gross: {calculateTotalWeight()} kg</span>
                                    <span className="text-yellow-500 text-xs font-normal block">Total CWT: {formData.packages.reduce((sum, p) => sum + (parseFloat(p.cwt) || 0), 0)} kg</span>
                                </div>
                            </label>

                            <div className="space-y-3">
                                {formData.packages.map((pkg, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-2 items-end bg-secondary-800 p-2 rounded relative group">
                                        <div className="col-span-2">
                                            <label className="text-[10px] text-gray-500 uppercase">Gross W (kg)</label>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                className="input-field py-1 text-sm px-1"
                                                value={pkg.weight}
                                                onChange={(e) => handlePackageChange(index, 'weight', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-4">
                                            <label className="text-[10px] text-gray-500 uppercase">Dims (L x W x H) cm</label>
                                            <div className="flex gap-1">
                                                <input
                                                    type="number"
                                                    placeholder="L"
                                                    className="input-field py-1 text-sm px-1 text-center"
                                                    value={pkg.length || ''}
                                                    onChange={(e) => handlePackageChange(index, 'length', e.target.value)}
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="W"
                                                    className="input-field py-1 text-sm px-1 text-center"
                                                    value={pkg.width || ''}
                                                    onChange={(e) => handlePackageChange(index, 'width', e.target.value)}
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="H"
                                                    className="input-field py-1 text-sm px-1 text-center"
                                                    value={pkg.height || ''}
                                                    onChange={(e) => handlePackageChange(index, 'height', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[10px] text-yellow-500 uppercase font-bold">CWT (kg)</label>
                                            <input
                                                type="number"
                                                placeholder="Auto"
                                                className="input-field py-1 text-sm px-1 border-yellow-700 text-yellow-500"
                                                value={pkg.cwt || ''}
                                                onChange={(e) => handlePackageChange(index, 'cwt', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[10px] text-gray-500 uppercase">Type</label>
                                            <select
                                                className="input-field py-1 text-sm px-1"
                                                value={pkg.type}
                                                onChange={(e) => handlePackageChange(index, 'type', e.target.value)}
                                            >
                                                <option>Box</option>
                                                <option>Pallet</option>
                                                <option>Crate</option>
                                                <option>Bundle</option>
                                                <option>Drum</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[10px] text-gray-500 uppercase">Item</label>
                                            <input
                                                type="text"
                                                placeholder="General"
                                                className="input-field py-1 text-sm px-1"
                                                value={pkg.commodity}
                                                onChange={(e) => handlePackageChange(index, 'commodity', e.target.value)}
                                            />
                                        </div>

                                        {/* Delete Button */}
                                        {formData.packages.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removePackage(index)}
                                                className="absolute -top-2 -right-2 bg-red-900/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-sm"
                                                title="Remove Package"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={addPackage}
                                className="mt-3 w-full py-2 border-2 border-dashed border-gray-600 text-gray-400 rounded hover:border-primary-500 hover:text-primary-500 hover:bg-secondary-800 transition-colors text-sm font-medium flex justify-center items-center gap-2"
                            >
                                <span>➕ Add Another Package</span>
                            </button>
                        </div>

                        <div className="mt-4">
                            <label className="label">AWB Number</label>
                            <div className="flex gap-2 items-center">
                                <input type="text" name="awb_number" className="input-field flex-1" placeholder="ATR-2026-001-AD" value={formData.awb_number} onChange={handleChange} readOnly />
                                {!formData.awb_number && !inquiry?.awb_request_id && isEditMode && (
                                    <button type="button" onClick={handleRequestAWB} className="px-4 py-2 border border-primary-600 text-primary-600 shadow-sm text-sm font-medium rounded-md hover:bg-primary-50" title="Request AWB Number from Admin">📦 Request AWB</button>
                                )}
                                {!formData.awb_number && inquiry?.awb_request_id && (
                                    <span className="px-3 py-2 bg-yellow-900/40 border border-yellow-700 text-yellow-500 text-sm font-medium rounded-md">⏳ AWB Pending</span>
                                )}
                                {formData.awb_number && (
                                    <a href={`https://atrexinternational.com/track-shipment/?awb=${formData.awb_number}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">🌍 Track</a>
                                )}
                            </div>
                            {!formData.awb_number && !isEditMode && <p className="text-xs text-gray-500 mt-1">Save RFQ first to request AWB number</p>}
                            {!formData.awb_number && (profile?.sales_code === 'SALES' || !profile?.sales_code) && (
                                <p className="text-[10px] text-yellow-500 mt-1">
                                    ⚠️ Your AWB might show "SALES". Go to <b>Settings</b> to update your Sales Code (e.g. JKT).
                                </p>
                            )}

                            {/* ONE-CLICK FIX for "SALES" AWB */}
                            {formData.awb_number && formData.awb_number.includes('SALES') && (
                                <div className="mt-2 flex items-center gap-2 bg-yellow-900/30 p-2 rounded border border-yellow-700/50">
                                    <span className="text-xs text-yellow-200">❌ Wrong Code?</span>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!confirm('Clean AWB number (remove "SALES")?')) return;
                                            try {
                                                setLoading(true);
                                                // Remove "-SALES" or "SALES-" to clean format
                                                // ATR-2026-02-SALES-001 -> ATR-2026-02-001
                                                const newAWB = formData.awb_number.replace('-SALES', '').replace('SALES-', '');

                                                // Direct update to Supabase
                                                const { error } = await supabase
                                                    .from('inquiries')
                                                    .update({ awb_number: newAWB })
                                                    .eq('id', inquiry.id);

                                                if (error) throw error;

                                                setFormData(prev => ({ ...prev, awb_number: newAWB }));
                                                showToast('✅ AWB Fixed! Now: ' + newAWB, 'success');
                                            } catch (err) {
                                                showToast('❌ Fix failed: ' + err.message, 'error');
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded shadow-sm"
                                    >
                                        🛠️ Remove "SALES"
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Financial Information */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-200 border-b border-gray-700 pb-2">Financial Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* ADMIN ONLY: Revenue & GP */}
                        {profile?.role === 'admin' && (
                            <>
                                <div>
                                    <label className="label">Est. Revenue (IDR)</label>
                                    <input type="number" name="est_revenue" className="input-field" placeholder="1000000" value={formData.est_revenue} onChange={handleChange} step="1000" />
                                </div>
                                <div>
                                    <label className="label">Est. GP (IDR)</label>
                                    <input type="number" name="est_gp" className="input-field" placeholder="200000" value={formData.est_gp} onChange={handleChange} step="1000" />
                                </div>
                            </>
                        )}
                        <div className="relative">
                            <label className="label flex items-center gap-2">
                                <span>💰 Your Commission</span>
                                {/* Approval Badge Removed */}
                            </label>
                            {profile?.role === 'admin' ? (
                                <div className="space-y-2">
                                    <div className="relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-400 sm:text-sm">Rp</span></div>
                                        <input type="number" name="est_commission" className="input-field pl-10 bg-secondary-800 border-yellow-600 text-yellow-500 font-bold text-lg focus:ring-yellow-500 focus:border-yellow-500" placeholder="0" value={formData.est_commission} onChange={handleChange} step="500" />
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                                        <span className="text-yellow-500/80">Formula: GP × 2% = {formatCurrency((parseFloat(formData.est_gp) || 0) * 0.02)}</span>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="relative">
                                        <input type="text" className="input-field bg-gradient-to-r from-secondary-800 to-secondary-900 border-2 border-yellow-600 text-yellow-500 font-bold text-lg shadow-[0_0_15px_rgba(234,179,8,0.2)]" value={formatCurrency(formData.est_commission)} disabled readOnly />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button type="submit" className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>{loading ? 'Saving...' : '💾 Save Inquiry'}</button>
                    {isEditMode && (
                        <>
                            <button type="button" className="px-4 py-2 border border-blue-600 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-colors" onClick={() => onQuote && onQuote(inquiry)}>📄 Print Quote</button>
                            <button type="button" className="px-4 py-2 border border-green-600 text-green-400 rounded-lg hover:bg-green-600 hover:text-white transition-colors" onClick={() => onPrintInvoice && onPrintInvoice(inquiry)}>🧾 Print Invoice</button>
                        </>
                    )}
                    <button type="button" className="btn-secondary" onClick={() => onSuccess && onSuccess()} disabled={loading}>❌ Cancel</button>
                    {isEditMode && profile?.role === 'admin' && (
                        <button
                            type="button"
                            className="btn-danger ml-auto bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                            onClick={async () => {
                                if (!confirm('Are you sure you want to REJECT this quote? Status will be set to Lost.')) return;
                                try {
                                    setLoading(true);
                                    await inquiryService.rejectQuote(inquiry.id);
                                    showToast('🚫 Quote Rejected', 'info');
                                    if (onSuccess) onSuccess();
                                } catch (err) {
                                    showToast('Failed to reject: ' + err.message, 'error');
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                        >
                            🚫 Reject Quote
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
