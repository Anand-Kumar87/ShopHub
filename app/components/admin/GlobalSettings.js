'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function GlobalSettings() {
    const [isLoading, setIsLoading] = useState(true);

    // Default Settings State
    const [settingsForm, setSettingsForm] = useState({
        storeName: 'ShopHub', contactEmail: 'concierge@shophub.com', currency: 'INR', maintenanceMode: false,
        taxRate: 0, freeShippingAmount: 0, shippingIndia: 0, shippingTier1: 0, shippingRow: 0,
        enableStripe: false, stripePublicKey: '', stripeSecretKey: '',
        enableRazorpay: true, razorpayKeyId: '', razorpayKeySecret: '',
        enableCOD: true,
        enableManualBank: false,
        bankName: '', bankAccountName: '', bankAccountNumber: '', bankIfscCode: '',
        enableShiprocket: false, shiprocketEmail: '', shiprocketPassword: '', shiprocketPickup: 'Primary'
    });

    // Load Settings on Mount
    useEffect(() => {
        const loadSettings = async () => {
            setIsLoading(true);
            try {
                // 🔥 FIX: Added 'no-store' to bypass Next.js aggressive caching and fetch fresh DB data
                const dbRes = await fetch('/api/admin/settings', { cache: 'no-store' });

                if (dbRes.ok) {
                    const dbData = await dbRes.json();
                    setSettingsForm(prev => ({ ...prev, ...dbData }));
                } else {
                    // Fallback to local storage if API is not ready
                    const localSettings = JSON.parse(localStorage.getItem('shophub_admin_settings'));
                    if (localSettings) setSettingsForm(prev => ({ ...prev, ...localSettings }));
                }
            } catch (error) {
                console.warn("API Error, loading local settings.");
                const localSettings = JSON.parse(localStorage.getItem('shophub_admin_settings'));
                if (localSettings) setSettingsForm(prev => ({ ...prev, ...localSettings }));
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, []);

    // Save Settings
    const handleSettingsSubmit = async (e) => {
        e.preventDefault();

        // Validation: If Manual Bank is enabled, check if details are provided
        if (settingsForm.enableManualBank) {
            if (!settingsForm.bankName || !settingsForm.bankAccountNumber || !settingsForm.bankIfscCode) {
                return toast.error("Please fill in all Bank Details for Direct Transfer!");
            }
        }

        // Sanitize numeric values
        const finalSettings = {
            ...settingsForm,
            taxRate: Number(settingsForm.taxRate),
            freeShippingAmount: Number(settingsForm.freeShippingAmount),
            shippingIndia: Number(settingsForm.shippingIndia),
            shippingTier1: Number(settingsForm.shippingTier1),
            shippingRow: Number(settingsForm.shippingRow),
        };

        try {
            // Push to API
            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalSettings)
            });

            // Check if server actually saved the data
            if (!response.ok) {
                throw new Error("Server rejected the save request.");
            }

            // Save local copy as backup
            localStorage.setItem('shophub_admin_settings', JSON.stringify(finalSettings));
            toast.success("Global settings & APIs updated successfully.");
        } catch (err) {
            console.error("Save Error:", err);
            // Offline fallback
            localStorage.setItem('shophub_admin_settings', JSON.stringify(finalSettings));
            toast.error("Saved locally. Server connection failed.");
        }
    };

    if (isLoading) {
        return <div className="text-stone-400 text-sm animate-pulse pt-10">Loading Store Preferences...</div>;
    }

    return (
        <div className="animate-fade-in max-w-3xl space-y-8">
            <h2 className="text-2xl font-light text-stone-900 mb-8 border-b border-stone-200 pb-4">Global <span className="font-serif italic font-bold">Preferences</span></h2>

            <form onSubmit={handleSettingsSubmit} className="space-y-12">

                {/* 1. GENERAL INFO */}
                <div>
                    <h3 className="text-lg font-bold text-stone-900 mb-6">General Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Maison Name</label>
                            <input
                                required
                                type="text"
                                value={settingsForm.storeName || ''}
                                onChange={e => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                                className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm font-bold text-stone-900"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Concierge Email</label>
                            <input
                                required
                                type="email"
                                value={settingsForm.contactEmail || ''}
                                onChange={e => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                                className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Default Base Currency</label>
                            <select
                                value={settingsForm.currency || 'INR'}
                                onChange={e => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                                className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm appearance-none font-bold"
                            >
                                <option value="INR">INR (₹)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2. PAYMENT GATEWAYS */}
                <div className="pt-8 border-t border-stone-100">
                    <h3 className="text-lg font-bold text-stone-900 mb-6">Payment Gateways & APIs</h3>

                    {/* Razorpay */}
                    <div className="mb-6 bg-stone-50 p-6 rounded-2xl border border-stone-200">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="text-sm font-bold text-stone-900">Razorpay (UPI & Indian Cards)</h4>
                                <p className="text-xs text-stone-500 mt-1">Best for Indian customers via UPI & Netbanking.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settingsForm.enableRazorpay || false}
                                    onChange={e => setSettingsForm({ ...settingsForm, enableRazorpay: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-stone-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
                            </label>
                        </div>
                        {settingsForm.enableRazorpay && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in mt-6 border-t border-stone-200 pt-6">
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Key ID</label>
                                    <input type="text" value={settingsForm.razorpayKeyId || ''} onChange={e => setSettingsForm({ ...settingsForm, razorpayKeyId: e.target.value })} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 text-sm font-mono" placeholder="rzp_test_..." />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Key Secret</label>
                                    <input type="password" value={settingsForm.razorpayKeySecret || ''} onChange={e => setSettingsForm({ ...settingsForm, razorpayKeySecret: e.target.value })} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 text-sm font-mono" placeholder="..." />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stripe */}
                    <div className="mb-6 bg-stone-50 p-6 rounded-2xl border border-stone-200">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="text-sm font-bold text-stone-900">Stripe (Credit/Debit Cards)</h4>
                                <p className="text-xs text-stone-500 mt-1">Accept global card payments.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settingsForm.enableStripe || false}
                                    onChange={e => setSettingsForm({ ...settingsForm, enableStripe: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-stone-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
                            </label>
                        </div>
                        {settingsForm.enableStripe && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in mt-6 border-t border-stone-200 pt-6">
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Publishable Key</label>
                                    <input type="text" value={settingsForm.stripePublicKey || ''} onChange={e => setSettingsForm({ ...settingsForm, stripePublicKey: e.target.value })} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 text-sm font-mono" placeholder="pk_test_..." />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Secret Key</label>
                                    <input type="password" value={settingsForm.stripeSecretKey || ''} onChange={e => setSettingsForm({ ...settingsForm, stripeSecretKey: e.target.value })} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 text-sm font-mono" placeholder="sk_test_..." />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 🔥 Manual Bank Transfer */}
                    <div className="mb-6 bg-stone-50 p-6 rounded-2xl border border-stone-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-stone-900">Direct Bank Transfer</h4>
                                <p className="text-xs text-stone-500 mt-1">Allow customers to manually wire funds.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={settingsForm.enableManualBank || false} onChange={e => setSettingsForm({ ...settingsForm, enableManualBank: e.target.checked })} />
                                <div className="w-11 h-6 bg-stone-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
                            </label>
                        </div>

                        {/* Bank Details Form */}
                        {settingsForm.enableManualBank && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in mt-6 border-t border-stone-200 pt-6">
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Bank Name *</label>
                                    <input type="text" value={settingsForm.bankName || ''} onChange={e => setSettingsForm({ ...settingsForm, bankName: e.target.value })} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 text-sm" placeholder="e.g. HDFC Bank" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Account Holder Name *</label>
                                    <input type="text" value={settingsForm.bankAccountName || ''} onChange={e => setSettingsForm({ ...settingsForm, bankAccountName: e.target.value })} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 text-sm" placeholder="e.g. ShopHub Enterprises" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Account Number *</label>
                                    <input type="text" value={settingsForm.bankAccountNumber || ''} onChange={e => setSettingsForm({ ...settingsForm, bankAccountNumber: e.target.value })} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 text-sm font-mono" placeholder="50100..." />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">IFSC / SWIFT Code *</label>
                                    <input type="text" value={settingsForm.bankIfscCode || ''} onChange={e => setSettingsForm({ ...settingsForm, bankIfscCode: e.target.value.toUpperCase() })} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 text-sm font-mono uppercase" placeholder="HDFC0001234" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Cash on Delivery (COD) */}
                    <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-stone-900">Cash on Delivery (COD)</h4>
                                <p className="text-xs text-stone-500 mt-1">Allow customers to pay in cash upon delivery.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={settingsForm.enableCOD || false} onChange={e => setSettingsForm({ ...settingsForm, enableCOD: e.target.checked })} />
                                <div className="w-11 h-6 bg-stone-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* 3. TAXES & LOGISTICS */}
                <div className="pt-8 border-t border-stone-100">
                    <h3 className="text-lg font-bold text-stone-900 mb-6">Taxes & Logistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Global Tax Rate (%)</label>
                            <input required type="number" step="0.01" value={settingsForm.taxRate || 0} onChange={e => setSettingsForm({ ...settingsForm, taxRate: e.target.value })} className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm font-mono" placeholder="e.g. 18 for 18%" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Free Shipping Threshold (INR)</label>
                            <input required type="number" value={settingsForm.freeShippingAmount || 0} onChange={e => setSettingsForm({ ...settingsForm, freeShippingAmount: e.target.value })} className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm font-mono" />
                        </div>
                    </div>

                    <h4 className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mt-8 mb-4">Shipping Zones (Base Rates in INR)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                        <div>
                            <label className="block text-xs font-medium text-stone-600 mb-2">India</label>
                            <input required type="number" value={settingsForm.shippingIndia || 0} onChange={e => setSettingsForm({ ...settingsForm, shippingIndia: e.target.value })} className="w-full px-4 py-3 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-stone-600 mb-2">Tier 1 (US/UK/EU)</label>
                            <input required type="number" value={settingsForm.shippingTier1 || 0} onChange={e => setSettingsForm({ ...settingsForm, shippingTier1: e.target.value })} className="w-full px-4 py-3 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-stone-600 mb-2">Rest of World</label>
                            <input required type="number" value={settingsForm.shippingRow || 0} onChange={e => setSettingsForm({ ...settingsForm, shippingRow: e.target.value })} className="w-full px-4 py-3 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm" />
                        </div>
                    </div>

                    {/* Shiprocket */}
                    <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="text-sm font-bold text-stone-900">Shiprocket Integration</h4>
                                <p className="text-xs text-stone-500 mt-1">Automatically push orders to Shiprocket.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settingsForm.enableShiprocket || false}
                                    onChange={e => setSettingsForm({ ...settingsForm, enableShiprocket: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-stone-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
                            </label>
                        </div>
                        {settingsForm.enableShiprocket && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in mt-6 border-t border-stone-200 pt-6">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Shiprocket Email</label>
                                    <input type="email" value={settingsForm.shiprocketEmail || ''} onChange={e => setSettingsForm({ ...settingsForm, shiprocketEmail: e.target.value })} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 text-sm" placeholder="admin@shophub.com" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Shiprocket Password</label>
                                    <input type="password" value={settingsForm.shiprocketPassword || ''} onChange={e => setSettingsForm({ ...settingsForm, shiprocketPassword: e.target.value })} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 text-sm" placeholder="••••••••" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Pickup Location Name</label>
                                    <input type="text" value={settingsForm.shiprocketPickup || ''} onChange={e => setSettingsForm({ ...settingsForm, shiprocketPickup: e.target.value })} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 text-sm" placeholder="Primary" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-8 border-t border-stone-100 flex justify-end sticky bottom-4 z-10">
                    <button
                        type="submit"
                        className="bg-stone-900 text-white text-xs font-bold tracking-widest uppercase px-10 py-4 rounded-full hover:bg-stone-800 transition-colors shadow-xl shadow-stone-900/20"
                    >
                        Save All Settings
                    </button>
                </div>
            </form>
        </div>
    );
}