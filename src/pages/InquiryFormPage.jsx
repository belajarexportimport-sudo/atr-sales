import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useModal } from '../contexts/ModalContext'; // Import Modal
import { calculateCommission, formatCurrency } from '../lib/utils';
import { inquiryService } from '../services/inquiryService';
import { commissionService } from '../services/commissionService';
import { leadService } from '../services/leadService';

export default function InquiryFormPage({ lead, inquiry, onSuccess, onQuote }) {
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
        packages: [{ weight: '', dimension: '', type: 'Box', commodity: '' }] // MULTI-COLLIE
    });

    // Helper: Add Package
    const addPackage = () => {
        setFormData(prev => ({
            ...prev,
            packages: [...prev.packages, { weight: '', dimension: '', type: 'Box', commodity: '' }]
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
            const existingPackages = inquiry.packages && inquiry.packages.length > 0
                ? inquiry.packages
                : [{
                    weight: inquiry.weight || '',
                    dimension: inquiry.dimension || '',
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
                packages: existingPackages
            });
        }
    }, [lead, inquiry]);

    // Auto-calculate commission
    useEffect(() => {
        if (formData.commission_approved) return;
        const revenue = parseFloat(formData.est_revenue) || 0;
        const gp = parseFloat(formData.est_gp) || 0;
        const commission = commissionService.calculate(revenue, gp);
        setFormData(prev => ({ ...prev, est_commission: commission }));
    }, [formData.est_revenue, formData.est_gp, formData.commission_approved]);

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
            await inquiryService.requestAWB(inquiry.id, user.id, profile.initials);
            showToast('✅ AWB request submitted! Admin will approve shortly.', 'success');
            if (onSuccess) onSuccess();
        } catch (err) {
            showToast('❌ Failed to request AWB: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Approve Commission (REFACTORED: Use Custom Modal)
    const handleApproveCommission = () => {
        if (!inquiry?.id) return showToast('❌ Please save the RFQ first', 'error');

        const amount = parseFloat(formData.est_commission) || 0;

        showConfirm(
            'Approve Commission',
            `Approve commission of ${formatCurrency(amount)} for this RFQ?`,
            async () => {
                try {
                    setLoading(true);
                    await commissionService.approve(inquiry.id, user.id, amount);
                    showToast('✅ Commission approved! Sales can now see the amount.', 'success');
                    if (onSuccess) onSuccess();
                } catch (err) {
                    showToast('❌ Failed to approve commission: ' + err.message, 'error');
                } finally {
                    setLoading(false);
                }
            },
            'warning'
        );
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
                dimension: formData.packages.map(p => p.dimension).join('; '),
                service_type: formData.service_type || null,
                est_revenue: formData.est_revenue ? parseFloat(formData.est_revenue) : null,
                est_gp: formData.est_gp ? parseFloat(formData.est_gp) : null,
                est_commission: formData.est_commission,
                // OPEN MARKET LOGIC: If Open Market, Status is UNASSIGNED
                status: (profile?.role === 'admin' && isOpenMarket) ? 'UNASSIGNED' : formData.status,
                shipment_date: formData.shipment_date || null,
                awb_number: formData.awb_number || null,
                packages: formData.packages // Save full structure to JSONB
            };

            if (inquiry?.id) {
                await inquiryService.update(inquiry.id, inquiryData, profile?.role);
            } else {
                await inquiryService.create(inquiryData);
            }

            showToast('✅ Inquiry saved successfully!', 'success');
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Error saving inquiry:', err);
            setError(err.message || 'Failed to save inquiry');
            showToast('❌ Failed to save inquiry', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-100">New Inquiry (v3.8 Modal)</h1>
                <p className="text-gray-400">Create a new customer inquiry</p>
            </header>

            {error && (
                <div className="bg-red-900/40 border border-red-800 text-red-200 px-4 py-3 rounded-lg mb-4">
                    {error}
                </div>
            )}

            {/* ADMIN ONLY: Inject to Open Market Toggle */}
            {profile?.role === 'admin' && !leadId && !isEditMode && (
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Origin *</label>
                                <input type="text" name="origin" className="input-field" placeholder="Jakarta" value={formData.origin} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="label">Destination *</label>
                                <input type="text" name="destination" className="input-field" placeholder="Singapore" value={formData.destination} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="label">Service Type</label>
                                <select name="service_type" className="input-field" value={formData.service_type} onChange={handleChange}>
                                    <option>Air Freight</option>
                                    <option>Sea Freight</option>
                                    <option>Express</option>
                                    <option>Trucking</option>
                                    <option>Warehouse</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Shipment Date</label>
                                <input type="date" name="shipment_date" className="input-field" value={formData.shipment_date} onChange={handleChange} />
                            </div>
                        </div>

                        {/* Multi-Collie Packages Section */}
                        <div className="mt-4 border border-gray-700 rounded-lg p-3 bg-secondary-900/30">
                            <label className="label mb-2 flex justify-between">
                                <span>📦 Packages ({formData.packages.length} items)</span>
                                <span className="text-primary-400 text-xs font-normal">Total: {calculateTotalWeight()} kg</span>
                            </label>

                            <div className="space-y-3">
                                {formData.packages.map((pkg, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-2 items-end bg-secondary-800 p-2 rounded relative group">
                                        <div className="col-span-3">
                                            <label className="text-[10px] text-gray-500 uppercase">Weight</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    className="input-field py-1 text-sm pr-6"
                                                    value={pkg.weight}
                                                    onChange={(e) => handlePackageChange(index, 'weight', e.target.value)}
                                                />
                                                <span className="absolute right-2 top-1.5 text-xs text-gray-500">kg</span>
                                            </div>
                                        </div>
                                        <div className="col-span-3">
                                            <label className="text-[10px] text-gray-500 uppercase">Dim (LxWxH)</label>
                                            <input
                                                type="text"
                                                placeholder="10x10x10"
                                                className="input-field py-1 text-sm"
                                                value={pkg.dimension}
                                                onChange={(e) => handlePackageChange(index, 'dimension', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <label className="text-[10px] text-gray-500 uppercase">Type</label>
                                            <select
                                                className="input-field py-1 text-sm"
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
                                        <div className="col-span-3">
                                            <label className="text-[10px] text-gray-500 uppercase">Commodity</label>
                                            <input
                                                type="text"
                                                placeholder="General"
                                                className="input-field py-1 text-sm"
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
                        </div>
                    </div>
                </div>

                {/* Financial Information */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-200 border-b border-gray-700 pb-2">Financial Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="label">Est. Revenue (IDR)</label>
                            <input type="number" name="est_revenue" className="input-field" placeholder="1000000" value={formData.est_revenue} onChange={handleChange} step="1000" />
                        </div>
                        {profile?.role === 'admin' && (
                            <div>
                                <label className="label">Est. GP (IDR)</label>
                                <input type="number" name="est_gp" className="input-field" placeholder="200000" value={formData.est_gp} onChange={handleChange} step="1000" />
                            </div>
                        )}
                        <div className="relative">
                            <label className="label flex items-center gap-2">
                                <span>💰 Your Commission</span>
                                {formData.commission_approved && <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-[10px] font-bold uppercase rounded-full shadow-lg border border-yellow-400">✓ APPROVED</span>}
                            </label>
                            {profile?.role === 'admin' ? (
                                <div className="space-y-2">
                                    <div className="relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-400 sm:text-sm">Rp</span></div>
                                        <input type="number" name="est_commission" className="input-field pl-10 bg-secondary-800 border-yellow-600 text-yellow-500 font-bold text-lg focus:ring-yellow-500 focus:border-yellow-500" placeholder="0" value={formData.est_commission} onChange={handleChange} step="500" />
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                                        <span className="text-yellow-500/80">Formula: GP × 2% = {formatCurrency((parseFloat(formData.est_gp) || 0) * 0.02)}</span>
                                        {!formData.commission_approved ? (
                                            formData.est_commission > 0 && isEditMode && (
                                                <button type="button" onClick={handleApproveCommission} className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold rounded-lg hover:from-yellow-400 hover:to-amber-500 shadow-lg shadow-yellow-900/50 transition-all text-xs">✓ Approve</button>
                                            )
                                        ) : (
                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, commission_approved: false }))} className="px-2 py-0.5 border border-red-500 text-red-400 hover:bg-red-900/30 rounded text-xs transition-colors">🔓 Unlock/Edit</button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {formData.commission_approved ? (
                                        <div className="relative">
                                            <input type="text" className="input-field bg-gradient-to-r from-secondary-800 to-secondary-900 border-2 border-yellow-600 text-yellow-500 font-bold text-lg shadow-[0_0_15px_rgba(234,179,8,0.2)]" value={formatCurrency(formData.est_commission)} disabled readOnly />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg></div>
                                        </div>
                                    ) : (
                                        <div className="relative"><input type="text" className="input-field bg-secondary-800 border-2 border-dashed border-gray-600 text-gray-400 italic" value="⏳ Pending Admin Approval" disabled readOnly /></div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button type="submit" className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>{loading ? 'Saving...' : '💾 Save Inquiry'}</button>
                    {isEditMode && (
                        <button type="button" className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors" onClick={() => onQuote && onQuote(inquiry)}>🖨️ Print Quote</button>
                    )}
                    <button type="button" className="btn-secondary" onClick={() => onSuccess && onSuccess()} disabled={loading}>❌ Cancel</button>
                </div>
            </form>
        </div>
    );
}
