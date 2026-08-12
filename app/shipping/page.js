'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiTruck, FiGlobe, FiClock, FiPackage } from 'react-icons/fi';
import { useGlobalCurrency } from '../context/CurrencyContext';
import { supabase } from '../utils/supabase'; // 🔥 Real Database Connection

export default function ShippingPage() {
    const [mounted, setMounted] = useState(false);

    // 🔥 Bring in Global Currency & Setup defaults
    const {
        currency,
        convertPrice,
        exchangeRate,
        freeShippingThreshold,
        shippingIndia,
        shippingTier1,
        shippingRow
    } = useGlobalCurrency() || {
        currency: 'USD',
        convertPrice: (v) => `$${Number(v).toFixed(2)}`,
        exchangeRate: 1,
        freeShippingThreshold: 100, // $100 base
        shippingIndia: 15,          // $15 base
        shippingTier1: 50,          // $50 base
        shippingRow: 80             // $80 base
    };

    const [dbSettings, setDbSettings] = useState(null);

    // 🔥 Fetch Real Logistics Settings from Admin DB
    useEffect(() => {
        setMounted(true);
        const fetchSettings = async () => {
            try {
                const { data, error } = await supabase.from('admin_settings').select('*').single();
                if (data && !error) {
                    setDbSettings(data);
                } else {
                    const localSettings = JSON.parse(localStorage.getItem('shophub_admin_settings'));
                    if (localSettings) setDbSettings(localSettings);
                }
            } catch (err) {
                console.error("Could not fetch logistics settings");
            }
        };
        fetchSettings();
    }, []);

    if (!mounted) return null;

    // 🔥 FIX: Removed manual exchangeRate multiplication because convertPrice handles it automatically!
    const baseFreeShipping = dbSettings?.freeShippingAmount ?? freeShippingThreshold;
    const baseShippingIN = dbSettings?.shippingIndia ?? shippingIndia;
    const baseShippingTier1 = dbSettings?.shippingTier1 ?? shippingTier1;
    const baseShippingRow = dbSettings?.shippingRow ?? shippingRow;

    return (
        <main className="bg-white min-h-screen animate-fade-in pb-24">

            {/* Minimalist Editorial Header */}
            <div className="bg-stone-50 pt-24 pb-20 border-b border-stone-200 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-4 block">
                        Delivery Guide
                    </span>
                    <h1 className="text-4xl md:text-6xl font-light text-stone-900 tracking-tight mb-6">
                        Shipping & <span className="font-serif italic font-bold">Delivery</span>
                    </h1>
                    <p className="text-stone-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                        Everything you need to know about how we meticulously pack and securely deliver your favorite pieces to your doorstep.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">

                <div className="space-y-16">

                    {/* 01. Order Processing */}
                    <section className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
                        <div className="flex-shrink-0">
                            <span className="text-sm font-bold text-stone-300 tracking-widest block mb-2">01</span>
                            <div className="w-14 h-14 bg-stone-50 rounded-full flex items-center justify-center text-stone-900">
                                <FiClock size={20} />
                            </div>
                        </div>
                        <div className="mt-2">
                            <h2 className="text-2xl font-light text-stone-900 mb-4">Processing Time</h2>
                            <p className="text-sm text-stone-500 leading-relaxed mb-3">
                                All orders are curated and processed within <span className="font-bold text-stone-900">1-2 business days</span> (excluding weekends and holidays) after receiving your order confirmation email. You will receive another notification when your order has shipped.
                            </p>
                            <p className="text-xs font-medium text-stone-400 italic">
                                * High volume periods (such as new collection drops or holidays) may cause a slight delay in processing.
                            </p>
                        </div>
                    </section>

                    {/* 02. Shipping Rates Table */}
                    <section className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
                        <div className="flex-shrink-0">
                            <span className="text-sm font-bold text-stone-300 tracking-widest block mb-2">02</span>
                            <div className="w-14 h-14 bg-stone-50 rounded-full flex items-center justify-center text-stone-900">
                                <FiPackage size={20} />
                            </div>
                        </div>
                        <div className="w-full mt-2">
                            <h2 className="text-2xl font-light text-stone-900 mb-4">Live Shipping Rates</h2>
                            <p className="text-sm text-stone-500 leading-relaxed mb-8">
                                Shipping charges for your order will be automatically calculated and displayed at checkout. Below are our current premium logistics rates based on your selected currency:
                            </p>

                            {/* Premium Editorial Table (Live Synced) */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b-2 border-stone-900">
                                            <th className="py-4 pr-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Destination</th>
                                            <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Timeline</th>
                                            <th className="py-4 pl-4 font-bold tracking-widest uppercase text-[10px] text-stone-400 text-right">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-stone-600">
                                        <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                                            <td className="py-5 pr-4 font-medium text-stone-900">Domestic (India)</td>
                                            <td className="py-5 px-4">2-4 Business Days</td>
                                            <td className="py-5 pl-4 text-right">Free <span className="text-stone-400 text-xs">(Over {convertPrice(baseFreeShipping)})</span> / {convertPrice(baseShippingIN)}</td>
                                        </tr>
                                        <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                                            <td className="py-5 pr-4 font-medium text-stone-900">Tier 1 (US, UK, EU, CA)</td>
                                            <td className="py-5 px-4">5-7 Business Days</td>
                                            <td className="py-5 pl-4 text-right">{convertPrice(baseShippingTier1)}</td>
                                        </tr>
                                        <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                                            <td className="py-5 pr-4 font-medium text-stone-900">Rest of the World</td>
                                            <td className="py-5 px-4">7-14 Business Days</td>
                                            <td className="py-5 pl-4 text-right font-bold text-stone-900">{convertPrice(baseShippingRow)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    {/* 03. International Shipping */}
                    <section className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
                        <div className="flex-shrink-0">
                            <span className="text-sm font-bold text-stone-300 tracking-widest block mb-2">03</span>
                            <div className="w-14 h-14 bg-stone-50 rounded-full flex items-center justify-center text-stone-900">
                                <FiGlobe size={20} />
                            </div>
                        </div>
                        <div className="mt-2">
                            <h2 className="text-2xl font-light text-stone-900 mb-4">International Orders</h2>
                            <p className="text-sm text-stone-500 leading-relaxed mb-6">
                                We proudly offer international shipping to over 100 countries worldwide. International shipping rates vary depending on the destination and the weight of the package.
                            </p>
                            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                                <h4 className="text-xs font-bold tracking-widest uppercase text-stone-900 mb-2">Duties & Taxes</h4>
                                <p className="text-sm text-stone-500 leading-relaxed">
                                    Your order may be subject to import duties and taxes (including VAT), which are incurred once a shipment reaches your destination country. ShopHub is not responsible for these charges if they are applied and are your responsibility as the customer.
                                </p>
                            </div>
                        </div>
                    </section>

                </div>

                {/* Contact CTA */}
                <div className="border-t border-stone-100 pt-16 mt-20 text-center">
                    <h3 className="text-xl font-light text-stone-900 mb-3">Where is my order?</h3>
                    <p className="text-sm text-stone-500 mb-8 max-w-md mx-auto">
                        Track your package using the tracking number sent to your email, or reach out to our concierge team.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/account?tab=orders"
                            className="w-full sm:w-auto inline-block bg-white text-stone-900 text-xs font-bold tracking-widest uppercase px-10 py-4 rounded-full border border-stone-200 hover:bg-stone-50 hover:border-stone-300 transition-all"
                        >
                            Track Order
                        </Link>
                        <Link
                            href="/contact"
                            className="w-full sm:w-auto inline-block bg-stone-900 text-white text-xs font-bold tracking-widest uppercase px-10 py-4 rounded-full hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/10"
                        >
                            Contact Concierge
                        </Link>
                    </div>
                </div>

            </div>
        </main>
    );
}
