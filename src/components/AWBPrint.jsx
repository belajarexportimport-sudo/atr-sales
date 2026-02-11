import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import Barcode from 'react-barcode';

export default function AWBPrint({ inquiry, onClose }) {
    const componentRef = useRef();
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        onAfterPrint: onClose
    });

    if (!inquiry) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header Actions */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-bold text-gray-800">Print AWB</h2>
                    <div className="space-x-2">
                        <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">🖨️ Print / Save PDF</button>
                        <button onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">Close</button>
                    </div>
                </div>

                {/* Printable Content */}
                <div ref={componentRef} className="p-8 bg-white text-black font-sans leading-tight">

                    {/* TOP HEADER */}
                    <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-4xl font-black tracking-tighter italic">ATR<span className="text-gray-600">EXPRESS</span></h1>
                            </div>
                            <p className="text-sm font-bold uppercase">International Logistics Service</p>
                        </div>
                        <div className="text-right">
                            <div className="mb-2">
                                <span className="block text-xs uppercase tracking-widest text-gray-500">SLS</span>
                                <span className="text-3xl font-mono font-bold tracking-widest">{inquiry.awb_number || 'PENDING'}</span>
                            </div>
                            <div className="inline-block bg-black text-white px-2 py-1 text-sm font-bold uppercase">
                                {inquiry.service_type || 'Standard Express'}
                            </div>
                        </div>
                    </div>

                    {/* BARCODE - REAL GENERATION */}
                    <div className="flex justify-center my-4">
                        {inquiry.awb_number ? (
                            <Barcode
                                value={inquiry.awb_number}
                                width={2}
                                height={60}
                                fontSize={14}
                                font="monospace"
                                margin={10}
                            />
                        ) : (
                            <div className="border-2 border-black border-dashed w-full h-16 flex items-center justify-center bg-gray-100">
                                <span className="text-gray-400 font-mono text-xs">NO AWB NUMBER</span>
                            </div>
                        )}
                    </div>

                    {/* SHIPPER & CONSIGNEE GRID */}
                    <div className="grid grid-cols-2 gap-0 border-2 border-black mb-6">
                        {/* Shipper */}
                        <div className="p-4 border-r-2 border-black">
                            <h3 className="text-xs uppercase font-bold text-gray-500 mb-1">From (Shipper)</h3>
                            <p className="font-bold text-sm uppercase">{inquiry.shipper_city || inquiry.origin}</p>
                            {(inquiry.shipper_postal_code || inquiry.origin_postal_code) && (
                                <p className="text-xs text-gray-600 font-mono mt-1">ZIP: {inquiry.shipper_postal_code || inquiry.origin_postal_code}</p>
                            )}

                            <p className="font-bold text-lg mt-2">{inquiry.shipper_name || 'ATR Express (Default)'}</p>
                            <p className="text-sm mt-1 whitespace-pre-line">{inquiry.shipper_address || inquiry.shipper_addr || 'Address not provided'}</p>
                            {inquiry.shipper_pic && <p className="text-sm mt-1"><span className="font-bold">PIC:</span> {inquiry.shipper_pic}</p>}
                            <p className="text-sm mt-2"><span className="font-bold">Tel:</span> {inquiry.shipper_phone || '-'}</p>
                        </div>

                        {/* Consignee */}
                        <div className="p-4">
                            <h3 className="text-xs uppercase font-bold text-gray-500 mb-1">To (Consignee)</h3>
                            <p className="font-bold text-sm uppercase">{inquiry.consignee_city || inquiry.destination}</p>
                            {(inquiry.consignee_postal_code || inquiry.destination_postal_code) && (
                                <p className="text-xs text-gray-600 font-mono mt-1">ZIP: {inquiry.consignee_postal_code || inquiry.destination_postal_code}</p>
                            )}

                            <p className="font-bold text-lg mt-2">{inquiry.consignee_name || inquiry.customer_name}</p>
                            <p className="text-sm mt-1 whitespace-pre-line">{inquiry.consignee_address || 'Address not provided'}</p>
                            {inquiry.consignee_pic && <p className="text-sm mt-1"><span className="font-bold">PIC:</span> {inquiry.consignee_pic}</p>}
                            <p className="text-sm mt-2"><span className="font-bold">Tel:</span> {inquiry.consignee_phone || '-'}</p>
                        </div>
                    </div>

                    {/* SHIPMENT DETAILS - MULTI COLLIE SUPPORT */}
                    {inquiry.packages && inquiry.packages.length > 0 ? (
                        <div className="mb-6">
                            <table className="w-full border-2 border-black text-xs">
                                <thead>
                                    <tr className="border-b-2 border-black bg-gray-100">
                                        <th className="p-1 border-r border-black text-center w-8">No</th>
                                        <th className="p-1 border-r border-black text-center">Type</th>
                                        <th className="p-1 border-r border-black text-center">Dims (L x W x H)</th>
                                        <th className="p-1 border-r border-black text-center">Gross W</th>
                                        <th className="p-1 text-center">CWT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inquiry.packages.map((pkg, idx) => (
                                        <tr key={idx} className="border-b border-black">
                                            <td className="p-1 border-r border-black text-center">{idx + 1}</td>
                                            <td className="p-1 border-r border-black text-center">{pkg.type}</td>
                                            <td className="p-1 border-r border-black text-center">
                                                {pkg.length ? `${pkg.length}x${pkg.width}x${pkg.height}` : pkg.dimension}
                                            </td>
                                            <td className="p-1 border-r border-black text-center">{parseFloat(pkg.weight) || 0} kg</td>
                                            <td className="p-1 text-center font-bold">
                                                {pkg.cwt ? `${parseFloat(pkg.cwt) || 0} kg` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {/* TOTALS ROW */}
                                    <tr className="bg-gray-200 font-bold">
                                        <td className="p-1 border-r border-black text-center" colSpan={3}>TOTAL ({inquiry.packages.length} Collies)</td>
                                        <td className="p-1 border-r border-black text-center">
                                            {inquiry.packages.reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0)} kg
                                        </td>
                                        <td className="p-1 text-center">
                                            {inquiry.packages.reduce((sum, p) => sum + (parseFloat(p.cwt) || 0), 0)} kg
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="border-2 border-t-0 border-black p-2">
                                <span className="block text-xs uppercase font-bold text-gray-500">Description of Goods / Commodity</span>
                                <p className="text-sm font-bold uppercase">
                                    {[...new Set(inquiry.packages.map(p => p.commodity).filter(Boolean))].join(', ') || inquiry.commodity || 'General Cargo'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* FALLBACK FOR LEGACY DATA */
                        <>
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="border-2 border-black p-2">
                                    <span className="block text-xs uppercase font-bold text-gray-500">Weight</span>
                                    <span className="block text-xl font-bold">{inquiry.weight} KG</span>
                                </div>
                                <div className="border-2 border-black p-2">
                                    <span className="block text-xs uppercase font-bold text-gray-500">Dimensions</span>
                                    <span className="block text-xl font-bold">{inquiry.dimension || '-'}</span>
                                </div>
                                <div className="border-2 border-black p-2">
                                    <span className="block text-xs uppercase font-bold text-gray-500">Pieces</span>
                                    <span className="block text-xl font-bold">{inquiry.pieces || 1}</span>
                                </div>
                            </div>
                            <div className="border-2 border-black p-4 mb-6">
                                <span className="block text-xs uppercase font-bold text-gray-500">Description of Goods / Commodity</span>
                                <p className="text-lg font-bold uppercase">{inquiry.commodity || 'General Cargo'}</p>
                            </div>
                        </>
                    )}

                    {/* FOOTER - SIGNATURES */}
                    <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t-2 border-black border-dashed">
                        <div className="text-center">
                            <div className="h-16 border-b border-black"></div>
                            <p className="text-xs font-bold mt-2 uppercase">Shipper Signature</p>
                        </div>
                        <div className="text-center">
                            <div className="h-16 border-b border-black"></div>
                            <p className="text-xs font-bold mt-2 uppercase">Driver / Pickup</p>
                        </div>
                        <div className="text-center">
                            <div className="h-16 border-b border-black"></div>
                            <p className="text-xs font-bold mt-2 uppercase">Date & Time</p>
                        </div>
                    </div>

                    <div className="mt-8 text-[10px] text-gray-500 text-justify">
                        TERMS & CONDITIONS: By signing this air waybill, the shipper acknowledges that they have read and agreed to the conditions of carriage.
                        Liability of the carrier is limited by the Warsaw Convention or the Montreal Convention, where applicable.
                        The shipper certifies that the particulars on the face hereof are correct and that the consignment DOES NOT CONTAIN any dangerous goods.
                    </div>

                    <div className="mt-2 text-center text-xs font-bold text-gray-600">
                        www.atrexinternational.com
                    </div>

                </div>
            </div>
        </div>
    );
}
