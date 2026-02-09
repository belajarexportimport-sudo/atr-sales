import React from 'react';

export default function ConsigneeForm({ formData, handleChange, handleCopyFromCustomer, handleClear }) {
    return (
        <div className="card space-y-4 border border-gray-700 p-4 rounded-lg bg-gray-800/50">
            <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
                <h3 className="text-lg font-semibold text-gray-200">📥 Consignee Information (Penerima)</h3>
                <div className="space-x-2">
                    <button
                        type="button"
                        onClick={handleCopyFromCustomer}
                        className="text-xs text-green-400 hover:text-green-300 font-medium px-2 py-1 border border-green-900 rounded bg-green-900/20"
                    >
                        Same as Customer
                    </button>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 border border-red-900 rounded bg-red-900/20"
                    >
                        Clear
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="label">Consignee Name</label>
                    <input
                        type="text"
                        name="consignee_name"
                        className="input-field"
                        placeholder="Receiver Name / Company"
                        value={formData.consignee_name || ''}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label className="label">PIC / Contact Person</label>
                    <input
                        type="text"
                        name="consignee_pic"
                        className="input-field"
                        placeholder="Ms. Jane"
                        value={formData.consignee_pic || ''}
                        onChange={handleChange}
                    />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="label">Address</label>
                    <textarea
                        name="consignee_address"
                        className="input-field h-20"
                        placeholder="Complete delivery address..."
                        value={formData.consignee_address || ''}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label className="label">City</label>
                    <input
                        type="text"
                        name="consignee_city"
                        className="input-field"
                        placeholder="New York"
                        value={formData.consignee_city || ''}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label className="label">Postal Code</label>
                    <input
                        type="text"
                        name="consignee_postal_code"
                        className="input-field"
                        placeholder="10001"
                        value={formData.consignee_postal_code || ''}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label className="label">Phone</label>
                    <input
                        type="tel"
                        name="consignee_phone"
                        className="input-field"
                        placeholder="+1 234..."
                        value={formData.consignee_phone || ''}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label className="label">Email</label>
                    <input
                        type="email"
                        name="consignee_email"
                        className="input-field"
                        placeholder="receiver@example.com"
                        value={formData.consignee_email || ''}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <p className="text-xs text-gray-500 mt-2 italic">
                * If left blank, AWB will default to Customer (Billing) information.
            </p>
        </div>
    );
}
