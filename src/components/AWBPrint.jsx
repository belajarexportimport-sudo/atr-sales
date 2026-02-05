import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { formatDate } from '../lib/utils';

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
                                {/* Use text logo if image fails or for simplicity */}
                                <h1 className="text-4xl font-black tracking-tighter italic">ATR<span className="text-gray-600">EXPRESS</span></h1>
                            </div>
                            <p className="text-sm font-bold uppercase">International Logistics Service</p>
                        </div>
                        <div className="text-right">
                            <div className="mb-2">
                                <span className="block text-xs uppercase tracking-widest text-gray-500">Air Waybill Number</span>
                                <span className="text-3xl font-mono font-bold tracking-widest">{inquiry.awb_number || 'PENDING'}</span>
                            </div>
                            <div className="inline-block bg-black text-white px-2 py-1 text-sm font-bold uppercase">
                                {inquiry.service_type || 'Standard Express'}
                            </div>
                        </div>
                    </div>

                    {/* BARCODE PLACEHOLDER */}
                    <div className="flex justify-center my-6">
                        <div className="border-2 border-black border-dashed w-full h-16 flex items-center justify-center bg-gray-100">
                            <span className="text-gray-400 font-mono text-xs tracking-[1em] uppercase">||| || ||| || |||||| || ||| |||| | ||</span>
                        </div>
                    </div>

                    {/* SHIPPER & CONSIGNEE GRID */}
                    <div className="grid grid-cols-2 gap-0 border-2 border-black mb-6">
                        {/* Shipper */}
                        <div className="p-4 border-r-2 border-black">
                            <h3 className="text-xs uppercase font-bold text-gray-500 mb-1">From (Shipper)</h3>
                            <p className="font-bold text-lg">{inquiry.shipper_name || 'N/A'}</p>
                            <p className="text-sm mt-1 whitespace-pre-line">{inquiry.shipper_address || 'Address not provided'}</p>
                            <p className="text-sm mt-2"><span className="font-bold">Tel:</span> {inquiry.shipper_phone || '-'}</p>
                            <p className="text-sm"><span className="font-bold">Origin:</span> {inquiry.origin}</p>
                        </div>

                        {/* Consignee */}
                        <div className="p-4">
                            <h3 className="text-xs uppercase font-bold text-gray-500 mb-1">To (Consignee)</h3>
                            <p className="font-bold text-lg">{inquiry.consignee_name || inquiry.customer_name}</p>
                            <p className="text-sm mt-1 whitespace-pre-line">{inquiry.consignee_address || 'Address not provided'}</p>
                            <p className="text-sm mt-2"><span className="font-bold">Tel:</span> {inquiry.consignee_phone || '-'}</p>
                            <p className="text-sm"><span className="font-bold">Destination:</span> {inquiry.destination}</p>
                        </div>
                    </div>

                    {/* SHIPMENT DETAILS */}
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

                </div>
            </div>
        </div>
    );
}
