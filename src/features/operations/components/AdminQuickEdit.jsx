import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../hooks/useToast';

/**
 * ADMIN QUICK EDIT COMPONENT
 * 
 * Allows admin to edit Revenue, GP, Commission, and AWB directly
 * without approval workflow.
 * 
 * USAGE:
 * <AdminQuickEdit inquiry={inquiry} onUpdate={handleRefresh} />
 */
export default function AdminQuickEdit({ inquiry, onUpdate }) {
    const { showToast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        revenue: inquiry?.est_revenue || '',
        gp: inquiry?.est_gp || '',
        commission: inquiry?.est_commission || '',
        awb: inquiry?.awb_number || ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Auto-calculate commission when GP changes
        if (name === 'gp' && value) {
            setFormData(prev => ({
                ...prev,
                commission: parseFloat(value) * 0.02
            }));
        }
    };

    const handleSave = async () => {
        setLoading(true);

        try {
            // Call RPC function to update
            const { data, error } = await supabase.rpc('admin_update_inquiry_financials', {
                p_inquiry_id: inquiry.id,
                p_revenue: formData.revenue ? parseFloat(formData.revenue) : null,
                p_gp: formData.gp ? parseFloat(formData.gp) : null,
                p_commission: formData.commission ? parseFloat(formData.commission) : null,
                p_awb_number: formData.awb || null
            });

            if (error) throw error;

            if (data?.success) {
                showToast('Updated successfully!', 'success');
                setIsEditing(false);
                if (onUpdate) onUpdate();
            } else {
                showToast(data?.message || 'Update failed', 'error');
            }
        } catch (error) {
            console.error('Error updating:', error);
            showToast(error.message || 'Failed to update', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            revenue: inquiry?.est_revenue || '',
            gp: inquiry?.est_gp || '',
            commission: inquiry?.est_commission || '',
            awb: inquiry?.awb_number || ''
        });
        setIsEditing(false);
    };

    if (!isEditing) {
        return (
            <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
                ✏️ Quick Edit
            </button>
        );
    }

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">
                    Edit: {inquiry.customer_name}
                </h4>
                <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-500"
                >
                    ✕
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Revenue */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Revenue (IDR)
                    </label>
                    <input
                        type="number"
                        name="revenue"
                        value={formData.revenue}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        placeholder="10000000"
                    />
                </div>

                {/* GP */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        GP (IDR)
                    </label>
                    <input
                        type="number"
                        name="gp"
                        value={formData.gp}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        placeholder="8000000"
                    />
                </div>

                {/* Commission (Auto-calculated) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Commission (IDR)
                    </label>
                    <input
                        type="number"
                        name="commission"
                        value={formData.commission}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Auto-calculated (GP * 2%)"
                        readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto: GP × 2%</p>
                </div>

                {/* AWB Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        AWB Number
                    </label>
                    <input
                        type="text"
                        name="awb"
                        value={formData.awb}
                        onChange={(e) => setFormData(prev => ({ ...prev, awb: e.target.value.toUpperCase() }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        placeholder="ATR-2026-02-AD-001"
                    />
                    <p className="text-xs text-gray-500 mt-1">Format: ATR-YYYY-MM-ID-SEQ</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? '💾 Saving...' : '💾 Save All'}
                </button>
            </div>
        </div>
    );
}
