import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

export default function InvoicePrint({ inquiry, onClose }) {
    const componentRef = useRef();
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        onAfterPrint: onClose
    });

    if (!inquiry) return null;

    // --- INVOICE TITLE LOGIC (Simple & Modular) ---
    // Proforma: Pre-shipment statuses (Profiling, Proposal, Negotiation, Won)
    // Final: Post-pickup/verification statuses (Won - Verification at WHS, Invoiced, Paid, etc.)
    console.log('DEBUG INVOICE STATUS:', inquiry?.status);

    const currentStatus = inquiry?.status || '';

    // Define status categories
    const proformaStatuses = ['Profiling', 'Proposal', 'Negotiation', 'Won'];
    const finalStatuses = ['Won - Verification at WHS', 'Invoiced', 'Paid', 'Overdue'];

    // Check if status matches final invoice criteria (case-insensitive)
    const isFinalInvoice = finalStatuses.some(s =>
        currentStatus.toLowerCase().includes(s.toLowerCase())
    );

    // Default to Proforma if status is explicitly in proforma list, otherwise use final check
    const isProforma = proformaStatuses.some(s =>
        s.toLowerCase() === currentStatus.toLowerCase()
    );

    const invoiceTitle = isFinalInvoice ? "FINAL INVOICE" :
        isProforma ? "PROFORMA INVOICE" :
            "PROFORMA INVOICE"; // Default fallback

    // Format Currency IDR
    const formatIDR = (num) => {
        const val = parseFloat(num);
        if (isNaN(val)) return 'Rp 0,00';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
    };

    // Safe Numeric Parsing
    const estRevenue = parseFloat(inquiry.est_revenue) || 0;
    const weight = parseFloat(inquiry.weight) || 1;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header Actions */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-bold text-gray-800">Print Invoice</h2>
                    <div className="space-x-2">
                        <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">🖨️ Print / Save PDF</button>
                        <button onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">Close</button>
                    </div>
                </div>

                {/* Printable Content */}
                <div ref={componentRef} className="p-8 bg-white text-black font-sans leading-tight">

                    {/* HEADER */}
                    <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-4xl font-black tracking-tighter italic">ATR<span className="text-gray-600">EXPRESS</span></h1>
                            </div>
                            <p className="text-sm font-bold uppercase">International Logistics Service</p>
                            <p className="text-xs mt-2 w-64">
                                Head Office: Grand Palace, Blok E – 401 Jl Raya Pasar Minggu KM.16,- Pancoran, Jakarta Selatan – 12780
                            </p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-3xl font-bold uppercase tracking-wide text-gray-800 mb-2">{invoiceTitle}</h2>
                            <div className="mb-1">
                                <span className="block text-xs uppercase tracking-widest text-gray-500">Invoice No</span>
                                <span className="text-xl font-mono font-bold">{inquiry.awb_number ? `INV-${inquiry.awb_number}` : 'DRAFT'}</span>
                            </div>
                            <div className="mb-1">
                                <span className="block text-xs uppercase tracking-widest text-gray-500">Date</span>
                                <span className="text-md font-bold">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>

                    {/* BILL TO & SHIP TO */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="text-xs uppercase font-bold text-gray-500 mb-2 border-b border-gray-300 pb-1">Bill To (Customer)</h3>
                            <p className="font-bold text-lg">{inquiry.customer_name}</p>
                            {/* Address could be added if we had billing address, for now use generic or empty */}
                        </div>
                        <div>
                            <h3 className="text-xs uppercase font-bold text-gray-500 mb-2 border-b border-gray-300 pb-1">Shipment Details</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="block text-gray-500 text-xs">Origin</span>
                                    <span className="font-bold">{inquiry.origin}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs">Destination</span>
                                    <span className="font-bold">{inquiry.destination}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs">Service</span>
                                    <span className="font-bold">{inquiry.service_type || 'Air Freight'}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs">AWB / Ref</span>
                                    <span className="font-bold">{inquiry.awb_number || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ITEMS TABLE */}
                    <table className="w-full mb-8 border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b-2 border-black text-xs uppercase font-bold text-gray-600">
                                <th className="p-2 text-left">Description</th>
                                <th className="p-2 text-center">Weight (KG)</th>
                                <th className="p-2 text-right">Rate / KG</th>
                                <th className="p-2 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-300">
                                <td className="p-3">
                                    <p className="font-bold">Freight Charge ({inquiry.service_type})</p>
                                    <p className="text-xs text-gray-500">
                                        Route: {inquiry.origin} - {inquiry.destination}<br />
                                        Commodity: {inquiry.commodity || 'General Cargo'}
                                    </p>
                                </td>
                                <td className="p-3 text-center align-top">{weight} kg</td>
                                <td className="p-3 text-right align-top">
                                    {/* Calculate Rate per KG based on Revenue / Weight */}
                                    {formatIDR(estRevenue / weight)}
                                </td>
                                <td className="p-3 text-right align-top font-bold">
                                    {formatIDR(estRevenue)}
                                </td>
                            </tr>
                            {/* Empty rows for spacing */}
                            <tr><td colSpan={4} className="h-24"></td></tr>
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-black text-lg">
                                <td colSpan={3} className="p-3 text-right font-bold uppercase">Total Amount</td>
                                <td className="p-3 text-right font-black bg-gray-100">{formatIDR(estRevenue)}</td>
                            </tr>
                        </tfoot>
                    </table>

                    {/* FOOTER / BANK DETAILS */}
                    <div className="grid grid-cols-2 gap-8 mt-12 border-t border-gray-300 pt-6">
                        <div>
                            <h3 className="text-sm font-bold uppercase mb-2">Payment Details</h3>
                            <p className="text-xs text-gray-600">Please transfer to:</p>
                            <div className="mt-2 text-sm">
                                <p><span className="font-bold">Bank:</span> BCA (Bank Central Asia)</p>
                                <p><span className="font-bold">Account:</span> 123-456-7890</p>
                                <p><span className="font-bold">Name:</span> PT. ATR EXPRESS INTERNATIONAL</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="mb-12">
                                <p className="text-sm font-bold">Authorized Signature</p>
                            </div>
                            <p className="text-xs font-bold uppercase border-t border-black inline-block pt-2 w-48 text-center">
                                Finance Dept
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 text-[10px] text-gray-400 text-center">
                        Generated by System on {new Date().toLocaleString()}
                    </div>

                </div>
            </div>
        </div>
    );
}
