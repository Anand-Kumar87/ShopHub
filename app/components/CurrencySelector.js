'use client';

import { useState, useRef, useEffect } from 'react';
import { useGlobalCurrency } from '../context/CurrencyContext'; // Apne path ke hisaab se adjust kar lena

const CURRENCIES = [
    { code: 'INR', label: 'IN', symbol: '₹' },
    { code: 'USD', label: 'US', symbol: '$' },
    { code: 'EUR', label: 'EU', symbol: '€' },
    { code: 'GBP', label: 'GB', symbol: '£' },
    { code: 'CAD', label: 'CA', symbol: 'C$' },
    { code: 'AUD', label: 'AU', symbol: 'A$' },
];

export default function CurrencySelector() {
    const { currency, changeCurrency } = useGlobalCurrency();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Bahar click karne par dropdown band karne ka logic
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Current active currency nikalo, default to USD if not found
    const activeCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[1];

    return (
        <div className="relative inline-block text-left z-[100]" ref={dropdownRef}>

            {/* Trigger Button (Closed State) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-200 border border-stone-100"
            >
                <span className="text-blue-600 font-black text-sm tracking-wide">
                    {activeCurrency.code}({activeCurrency.symbol})
                </span>
                <span className="text-stone-900 font-bold text-sm">
                    {activeCurrency.label}
                </span>
            </button>

            {/* Dropdown Menu (Opened State) */}
            {isOpen && (
                <div className="absolute top-full mt-2 left-0 w-36 bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden py-3 animate-fade-in origin-top-left">
                    {CURRENCIES.map((curr) => (
                        <button
                            key={curr.code}
                            onClick={() => {
                                changeCurrency(curr.code);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-5 py-2.5 transition-colors ${currency === curr.code ? 'bg-stone-50' : 'hover:bg-stone-50'
                                }`}
                        >
                            <span className="text-stone-900 font-bold text-base">
                                {curr.label}
                            </span>
                            <span className={`font-bold text-sm tracking-wide ${currency === curr.code ? 'text-blue-600' : 'text-blue-600/70'
                                }`}>
                                {curr.code}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
