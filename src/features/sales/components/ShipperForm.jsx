import React from 'react';

export default function ShipperForm({ formData, handleChange, handleClear }) {
    return (
        <div className="card space-y-4 border border-gray-700 p-4 rounded-lg bg-gray-800/50">
            <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
                <h3 className="text-lg font-semibold text-gray-200">📤 Shipper Information (Pengirim)</h3>
                <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 border border-red-900 rounded bg-red-900/20"
                >
                    Clear Shipper
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="label">Shipper Name</label>
                    <input
                        type="text"
                        name="shipper_name"
                        className="input-field"
                        placeholder="PT. Sender Indonesia"
                        value={formData.shipper_name || ''}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label className="label">PIC / Contact Person</label>
                    <input
                        type="text"
                        name="shipper_pic"
                        className="input-field"
                        placeholder="Mr. Budi"
                        value={formData.shipper_pic || ''}
                        onChange={handleChange}
                    />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="label">Address</label>
                    <textarea
                        name="shipper_address"
                        className="input-field h-20"
                        placeholder="Complete pickup address..."
                        value={formData.shipper_address || ''}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label className="label">City</label>
                    <input
                        type="text"
                        name="shipper_city"
                        className="input-field"
                        placeholder="Jakarta"
                        value={formData.shipper_city || ''}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label className="label">Postal Code</label>
                    <input
                        type="text"
                        name="shipper_postal_code"
                        className="input-field"
                        placeholder="12345"
                        value={formData.shipper_postal_code || ''}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label className="label">Phone</label>
                    <input
                        type="tel"
                        name="shipper_phone"
                        className="input-field"
                        placeholder="+62 812..."
                        value={formData.shipper_phone || ''}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label className="label">Email</label>
                    <input
                        type="email"
                        name="shipper_email"
                        className="input-field"
                        placeholder="sender@example.com"
                        value={formData.shipper_email || ''}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <p className="text-xs text-gray-500 mt-2 italic">
                * If left blank, AWB will default to "ATR Express" or generic info where applicable.
            </p>
        </div>
    );
}
