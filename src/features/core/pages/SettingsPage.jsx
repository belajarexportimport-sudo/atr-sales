import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { supabase } from '../../../lib/supabase';

export default function SettingsPage() {
    const { user, profile } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        sales_code: '', // Initialize status
        bank_name: '',
        bank_account_no: '',
        bank_holder_name: '',
        preferences: {
            notifications: true,
            focus_mode: false
        }
    });

    // Load initial data
    useEffect(() => {
        if (profile) {
            setFormData({
                sales_code: profile.sales_code || '',
                bank_name: profile.bank_name || '',
                bank_account_no: profile.bank_account_no || '',
                bank_holder_name: profile.bank_holder_name || '',
                preferences: {
                    notifications: profile.preferences?.notifications ?? true,
                    focus_mode: profile.preferences?.focus_mode ?? false
                }
            });
        }
    }, [profile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleToggle = (key) => {
        setFormData(prev => ({
            ...prev,
            preferences: {
                ...prev.preferences,
                [key]: !prev.preferences[key]
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const updates = {
                id: user.id,
                sales_code: formData.sales_code, // Add sales_code to update
                bank_name: formData.bank_name,
                bank_account_no: formData.bank_account_no,
                bank_holder_name: formData.bank_holder_name,
                preferences: formData.preferences,
                updated_at: new Date()
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            showToast('✅ Settings updated successfully!', 'success');
        } catch (error) {
            console.error(error);
            showToast('❌ Failed to update settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-2xl mx-auto">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-100">Settings</h1>
                <p className="text-gray-400">Manage your profile and preferences</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Account Information Section */}
                <div className="card space-y-4">
                    <h2 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2">
                        👤 Account Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Sales Code (Initials)</label>
                            <input
                                type="text"
                                name="sales_code"
                                className="input-field"
                                placeholder="e.g. JKT / AD / RF"
                                value={formData.sales_code}
                                onChange={handleChange}
                                maxLength={5}
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Appears in AWB Number (e.g. ATR-2026-JKT-001)</p>
                        </div>
                        <div>
                            <label className="label">Full Name</label>
                            <input
                                type="text"
                                className="input-field bg-gray-800 cursor-not-allowed"
                                value={profile?.full_name || user?.email?.split('@')[0] || 'Not set'}
                                readOnly
                                disabled
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="label">Email Address</label>
                            <input
                                type="email"
                                className="input-field bg-gray-800 cursor-not-allowed"
                                value={user?.email || 'Not set'}
                                readOnly
                                disabled
                            />
                        </div>
                    </div>
                </div>

                {/* Bank Details Section */}
                <div className="card space-y-4">
                    <h2 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2">
                        💳 Bank Details (For Commission)
                    </h2>
                    <p className="text-sm text-gray-400">
                        Please provide your bank details to facilitate commission payments.
                    </p>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="label">Bank Name</label>
                            <input
                                type="text"
                                name="bank_name"
                                className="input-field"
                                placeholder="BCA / Mandiri / BNI"
                                value={formData.bank_name}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="label">Account Number</label>
                            <input
                                type="number"
                                name="bank_account_no"
                                className="input-field font-mono"
                                placeholder="1234567890"
                                value={formData.bank_account_no}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="label">Account Holder Name</label>
                            <input
                                type="text"
                                name="bank_holder_name"
                                className="input-field"
                                placeholder="Sesuai Buku Tabungan"
                                value={formData.bank_holder_name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Preferences Section */}
                <div className="card space-y-4">
                    <h2 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2">
                        ⚙️ Preferences
                    </h2>

                    <div className="space-y-4">
                        {/* Toggle 1 */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-200">Enable Notifications</h3>
                                <p className="text-xs text-gray-500">Receive alerts for approvals & leads</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle('notifications')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.preferences.notifications ? 'bg-primary-600' : 'bg-gray-700'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition transition-transform ${formData.preferences.notifications ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>

                        {/* Toggle 2 */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-200">Focus Mode (Hide Balance)</h3>
                                <p className="text-xs text-gray-500">Hide revenue & commission amount on dashboard</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle('focus_mode')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.preferences.focus_mode ? 'bg-primary-600' : 'bg-gray-700'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition transition-transform ${formData.preferences.focus_mode ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        className="btn-primary w-full md:w-auto"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : '💾 Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
}
