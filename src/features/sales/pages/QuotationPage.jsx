import { formatCurrency, formatDate } from '../../../lib/utils';

export default function QuotationPage({ inquiry, lead, salesRep, onBack }) {
    if (!inquiry) return <div className="p-8 text-center">No inquiry data found for quotation.</div>;

    const totalWeight = inquiry.weight || (inquiry.packages || []).reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0);
    const packages = inquiry.packages && inquiry.packages.length > 0
        ? inquiry.packages
        : [{
            weight: inquiry.weight,
            dimension: inquiry.dimension,
            type: inquiry.package_type || 'Box',
            commodity: inquiry.commodity || 'General Cargo'
        }];

    // Calculate Unit Rate based on simple division if not provided, or just show total.
    // Usually Quotation shows Unit Rate per Kg.
    const estRevenue = parseFloat(inquiry.est_revenue) || 0;
    const unitRate = totalWeight > 0 ? estRevenue / totalWeight : 0;

    return (
        <div className="bg-gray-100 min-h-screen p-4 print:p-0 print:bg-white">
            {/* NO-PRINT Toolbar */}
            <div className="max-w-[210mm] mx-auto mb-4 flex justify-between items-center print:hidden">
                <button
                    onClick={onBack}
                    className="px-4 py-2 bg-gray-600 text-white rounded shadow hover:bg-gray-700"
                >
                    ⬅ Back
                </button>
                <div className="text-gray-600 text-sm">
                    Review before printing
                </div>
                <button
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 font-bold flex items-center gap-2"
                >
                    🖨️ Print / Save PDF
                </button>
            </div>

            {/* A4 PAPER CONTAINER */}
            <div id="quotation-print-area" className="max-w-[210mm] mx-auto bg-white shadow-xl min-h-[297mm] p-[15mm] text-black relative print:shadow-none print:w-full">

                {/* Removed: DRAFT WATERMARK - quotations no longer require approval */}

                {/* HEADER */}
                <header className="flex justify-between items-start border-b-2 border-primary-800 pb-4 mb-8 relative z-10">
                    <div>
                        <img src="/logo_atr_official.png" alt="ATR Express" className="h-24 w-auto mb-2 object-contain" />
                    </div>
                    <div className="text-right">
                        <h1 className="text-3xl font-bold text-primary-800 uppercase tracking-widest">Quotation</h1>
                        <p className="text-sm font-bold mt-1">NO: Q-{inquiry.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-sm text-gray-500">Date: {formatDate(new Date())}</p>
                    </div>
                </header>

                {/* SENDER / RECEIVER INFO */}
                <div className="flex justify-between mb-8 gap-8">
                    <div className="w-1/2">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Prepared For:</h3>
                        <p className="font-bold text-lg">{inquiry.customer_name}</p>
                        {inquiry.pic && <p className="text-sm">{inquiry.pic}</p>}
                        {inquiry.phone && <p className="text-sm">{inquiry.phone}</p>}
                        {inquiry.email && <p className="text-sm">{inquiry.email}</p>}
                    </div>
                    <div className="w-1/2 text-right">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">From:</h3>
                        <p className="font-bold text-lg">ATR Express International</p>
                        <p className="text-sm">Ruko Golden Boulevard Blok W2 No. 19</p>
                        <p className="text-sm">BSD City, Tangerang Selatan, 15318</p>
                        <p className="text-sm">cs@atrexpress.com</p>
                    </div>
                </div>

                {/* SHIPMENT DETAILS */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-8 break-inside-avoid">
                    <h3 className="font-bold text-primary-800 border-b border-gray-300 pb-2 mb-3 uppercase text-sm">Shipment Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-gray-500 block text-xs uppercase">Origin</span> <span className="font-bold">{inquiry.origin}</span></div>
                        <div><span className="text-gray-500 block text-xs uppercase">Destination</span> <span className="font-bold">{inquiry.destination}</span></div>
                        <div><span className="text-gray-500 block text-xs uppercase">Service Type</span> <span className="font-bold">{inquiry.service_type || 'Air Freight'}</span></div>
                        <div><span className="text-gray-500 block text-xs uppercase">Est. Shipment Date</span> <span className="font-bold">{inquiry.shipment_date ? formatDate(inquiry.shipment_date) : 'TBA'}</span></div>
                    </div>
                </div>

                {/* ITEMS TABLE */}
                <div className="mb-8">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-primary-900 text-white uppercase text-xs">
                                <th className="p-3 text-left rounded-tl">Description</th>
                                <th className="p-3 text-center">Qty</th>
                                <th className="p-3 text-center">Weight (kg)</th>
                                <th className="p-3 text-center">Dimensions (cm)</th>
                                <th className="p-3 text-right rounded-tr">Total Weight</th>
                            </tr>
                        </thead>
                        <tbody>
                            {packages.map((pkg, idx) => (
                                <tr key={idx} className="border-b border-gray-200">
                                    <td className="p-3">
                                        <div className="font-bold">{pkg.commodity || 'General Cargo'}</div>
                                        <div className="text-xs text-gray-500">{pkg.type}</div>
                                    </td>
                                    <td className="p-3 text-center">1</td>
                                    <td className="p-3 text-center">{pkg.weight}</td>
                                    <td className="p-3 text-center">{pkg.dimension}</td>
                                    <td className="p-3 text-right font-bold">{pkg.weight}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-100 font-bold">
                                <td colSpan={4} className="p-3 text-right uppercase text-xs">Total Chargeable Weight</td>
                                <td className="p-3 text-right">{totalWeight} kg</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* QUOTE TOTAL */}
                <div className="flex justify-end mb-12 break-inside-avoid">
                    <div className="w-full md:w-1/2">
                        <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-600">Freight Charge (approx. {formatCurrency(unitRate)}/kg)</span>
                            <span className="font-bold">{formatCurrency(estRevenue)}</span>
                        </div>
                        {/* 
                        <div className="flex justify-between py-2 border-b border-gray-200 text-gray-500">
                            <span>Surcharges</span>
                            <span>Included</span>
                        </div>
                         */}
                        <div className="flex justify-between py-3 border-b-2 border-primary-800 text-xl font-bold text-primary-900 mt-2">
                            <span>TOTAL ESTIMATED</span>
                            <span>{formatCurrency(estRevenue)}</span>
                        </div>
                        <p className="text-right text-[10px] text-gray-400 mt-1 italic">*Rates validated for 7 days</p>
                    </div>
                </div>

                {/* TERMS */}
                <div className="border-t border-gray-300 pt-4 mb-12 text-xs text-gray-500 text-justify break-inside-avoid">
                    <h4 className="font-bold text-gray-700 uppercase mb-1">Terms & Conditions</h4>
                    <p className="mb-1">1. Rates are subject to change without prior notice unless booked.</p>
                    <p className="mb-1">2. Chargeable weight is based on the higher of actual or volumetric weight (Divisor 6000 for Air, 4000 for Trucking/Sea).</p>
                    <p className="mb-1">3. Excludes duties, taxes, and customs inspection fees at destination unless DDP specified.</p>
                    <p className="mb-1">4. Liability is limited as per standard trading conditions. Insurance is recommended.</p>
                </div>

                {/* SIGNATURE */}
                <div className="flex justify-between items-end mt-auto break-inside-avoid">
                    <div className="text-center">
                        <div className="h-16 mb-2 border-b border-gray-400 w-48"></div>
                        <p className="font-bold text-sm text-gray-600">Customer Acceptance</p>
                    </div>
                    <div className="text-center">
                        {/* <div className="h-12 mb-2"><img src="/signature-placeholder.png" alt="Sig" className="h-full mx-auto opacity-50"/></div> */}
                        <div className="h-16 mb-2 flex items-end justify-center">
                            <span className="font-script text-2xl text-blue-900">{salesRep?.full_name || 'ATR Sales Team'}</span>
                        </div>
                        <div className="border-b border-gray-400 w-48 mx-auto"></div>
                        <p className="font-bold text-sm text-gray-600">Authorized Signature</p>
                    </div>
                </div>

                {/* WEBSITE FOOTER */}
                <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm font-bold text-primary-800 break-inside-avoid">
                    www.atrexinternational.com
                </div>

            </div>
        </div>
    );
}
