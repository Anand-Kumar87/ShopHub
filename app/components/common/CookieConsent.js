'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiShield, FiCheck, FiSliders, FiX } from 'react-icons/fi';
import { BiCookie } from 'react-icons/bi';

const CONSENT_STORAGE_KEY = 'shophub_cookie_consent';

export default function CookieConsent() {
    const [mounted, setMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);

    // Consent preferences
    const [preferences, setPreferences] = useState({
        essential: true, // Always true & disabled
        analytics: true,
        marketing: true,
    });

    useEffect(() => {
        setMounted(true);

        try {
            const storedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
            if (!storedConsent) {
                // Delay 800ms for smooth initial page entrance
                const timer = setTimeout(() => {
                    setIsVisible(true);
                }, 800);
                return () => clearTimeout(timer);
            } else {
                try {
                    const parsed = JSON.parse(storedConsent);
                    if (parsed && typeof parsed === 'object') {
                        setPreferences(prev => ({
                            ...prev,
                            analytics: !!parsed.analytics,
                            marketing: !!parsed.marketing,
                        }));
                    }
                } catch { }
            }
        } catch { }

        // Allow reopening via footer or custom event
        const handleOpen = () => {
            setIsVisible(true);
            setShowPreferences(true);
        };
        window.addEventListener('openCookiePreferences', handleOpen);
        return () => window.removeEventListener('openCookiePreferences', handleOpen);
    }, []);

    const saveConsent = (consentData) => {
        try {
            const payload = {
                status: consentData.status,
                essential: true,
                analytics: consentData.analytics,
                marketing: consentData.marketing,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };

            localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));

            // Set a cookie so server/edge middleware can inspect if needed
            document.cookie = `${CONSENT_STORAGE_KEY}=${consentData.status}; path=/; max-age=31536000; SameSite=Lax`;

            // Notify application / telemetry
            window.dispatchEvent(new CustomEvent('cookieConsentChange', { detail: payload }));
        } catch (err) {
            console.error('Failed to save cookie consent:', err);
        }

        setIsVisible(false);
        setShowPreferences(false);
    };

    const handleAcceptAll = () => {
        saveConsent({
            status: 'accepted_all',
            analytics: true,
            marketing: true,
        });
    };

    const handleEssentialOnly = () => {
        saveConsent({
            status: 'essential_only',
            analytics: false,
            marketing: false,
        });
    };

    const handleSavePreferences = () => {
        saveConsent({
            status: 'customized',
            analytics: preferences.analytics,
            marketing: preferences.marketing,
        });
    };

    if (!mounted || !isVisible) return null;

    return (
        <>
            {/* 1. Main Floating Luxury Consent Card */}
            <aside
                aria-label="Cookie and Privacy Consent"
                className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 max-w-md w-[calc(100%-2rem)] sm:w-full z-[99998] transition-all duration-700 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'
                    }`}
            >
                <div className="bg-stone-950/95 backdrop-blur-xl border border-stone-800 text-stone-100 rounded-3xl p-6 sm:p-7 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] relative overflow-hidden">
                    
                    {/* Subtle Luxury Accent Line */}
                    <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"></div>

                    {/* Header with Icon & Title */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                                <BiCookie size={22} />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400/80 block">
                                    Privacy & Cookies
                                </span>
                                <h3 className="text-base font-light text-white tracking-tight">
                                    Your Privacy <span className="font-serif italic font-bold">Matters</span>
                                </h3>
                            </div>
                        </div>

                        {/* Quick dismiss / essential only close */}
                        <button
                            onClick={handleEssentialOnly}
                            title="Decline optional cookies"
                            aria-label="Close and decline optional cookies"
                            className="text-stone-400 hover:text-white p-1 rounded-full hover:bg-stone-800 transition-colors"
                        >
                            <FiX size={16} />
                        </button>
                    </div>

                    {/* Body text */}
                    <p className="text-xs text-stone-300 leading-relaxed mb-5 font-normal">
                        We use essential cookies for secure browsing, checkout, and session authentication. We also request optional cookies to personalize your boutique experience and curate recommendations in accordance with our{' '}
                        <Link
                            href="/privacy-policy"
                            className="text-amber-300 underline underline-offset-4 hover:text-white transition-colors"
                        >
                            Privacy Policy
                        </Link>{' '}
                        and{' '}
                        <Link
                            href="/terms"
                            className="text-stone-300 underline underline-offset-4 hover:text-white transition-colors"
                        >
                            Terms
                        </Link>.
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2.5">
                        <button
                            onClick={handleAcceptAll}
                            className="flex-1 bg-white hover:bg-stone-100 text-stone-950 text-[11px] font-bold tracking-widest uppercase py-3 px-4 rounded-full transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                        >
                            <FiCheck size={14} /> Accept All
                        </button>
                        <button
                            onClick={handleEssentialOnly}
                            className="flex-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-white text-[11px] font-bold tracking-widest uppercase py-3 px-4 rounded-full transition-colors flex items-center justify-center"
                        >
                            Essential Only
                        </button>
                        <button
                            onClick={() => setShowPreferences(true)}
                            className="px-3.5 py-3 rounded-full border border-stone-800 hover:border-stone-700 text-stone-400 hover:text-white transition-colors flex items-center justify-center"
                            title="Manage Preferences"
                            aria-label="Manage cookie preferences"
                        >
                            <FiSliders size={14} />
                        </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-800/80 flex justify-between items-center text-[10px] text-stone-400 tracking-wider uppercase">
                        <span className="flex items-center gap-1.5">
                            <FiShield className="text-amber-400/70" size={11} /> GDPR & CCPA Compliant
                        </span>
                        <button
                            onClick={() => setShowPreferences(true)}
                            className="text-stone-300 hover:text-white underline underline-offset-2 transition-colors"
                        >
                            Preferences
                        </button>
                    </div>
                </div>
            </aside>

            {/* 2. Detailed Cookie Preferences Modal */}
            {showPreferences && (
                <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
                        
                        {/* Close button */}
                        <button
                            onClick={() => setShowPreferences(false)}
                            aria-label="Close preferences"
                            className="absolute top-6 right-6 text-stone-400 hover:text-white p-1 rounded-full hover:bg-stone-800 transition-colors"
                        >
                            <FiX size={18} />
                        </button>

                        <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400 block mb-1">
                            Granular Controls
                        </span>
                        <h2 className="text-2xl font-light text-white tracking-tight mb-2">
                            Cookie <span className="font-serif italic font-bold">Preferences</span>
                        </h2>
                        <p className="text-xs text-stone-400 leading-relaxed mb-6">
                            Customize which cookies you wish to allow. Essential cookies are required to deliver basic security, shopping cart persistence, and payment transactions.
                        </p>

                        <div className="space-y-4 mb-8">
                            {/* Essential Cookies */}
                            <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80 flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-white tracking-wide">Strictly Necessary Cookies</h4>
                                        <span className="text-[9px] font-bold uppercase tracking-widest bg-stone-800 text-stone-300 px-2 py-0.5 rounded-full">
                                            Always Active
                                        </span>
                                    </div>
                                    <p className="text-xs text-stone-400 leading-relaxed">
                                        Required for core functions such as secure checkout, user authentication, shopping bag state, and currency conversions.
                                    </p>
                                </div>
                                <div className="pt-1">
                                    <input
                                        type="checkbox"
                                        checked={true}
                                        disabled={true}
                                        className="h-5 w-5 rounded-full accent-amber-400 cursor-not-allowed opacity-80"
                                    />
                                </div>
                            </div>

                            {/* Analytics Cookies */}
                            <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80 flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-white tracking-wide">Analytics & Performance</h4>
                                    <p className="text-xs text-stone-400 leading-relaxed">
                                        Help us understand how guests navigate ShopHub so we can measure performance and optimize user flow anonymously.
                                    </p>
                                </div>
                                <div className="pt-1">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={preferences.analytics}
                                            onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
                                    </label>
                                </div>
                            </div>

                            {/* Marketing & Personalization */}
                            <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80 flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-white tracking-wide">Personalized Experience</h4>
                                    <p className="text-xs text-stone-400 leading-relaxed">
                                        Enables curated editorial recommendations, personalized wishlist reminders, and relevant notifications.
                                    </p>
                                </div>
                                <div className="pt-1">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={preferences.marketing}
                                            onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleSavePreferences}
                                className="flex-1 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold tracking-widest uppercase py-3.5 px-6 rounded-full transition-colors text-center shadow-lg"
                            >
                                Save Preferences
                            </button>
                            <button
                                onClick={handleAcceptAll}
                                className="flex-1 bg-white hover:bg-stone-100 text-stone-950 text-xs font-bold tracking-widest uppercase py-3.5 px-6 rounded-full transition-colors text-center"
                            >
                                Accept All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
