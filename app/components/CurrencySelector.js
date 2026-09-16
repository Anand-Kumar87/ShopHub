'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useGlobalCurrency, CURRENCIES } from '../context/CurrencyContext';
import CountryFlag from './common/CountryFlag';

export default function CurrencySelector({ align = 'auto', fullWidth = false }) {
    const { currency, changeCurrency, activeCurrency } = useGlobalCurrency();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    // Close on click outside or Escape key
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
            // Auto focus search on open
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    // Filter currencies based on search
    const filteredCurrencies = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return CURRENCIES;
        return CURRENCIES.filter(item =>
            item.code.toLowerCase().includes(query) ||
            item.name.toLowerCase().includes(query) ||
            item.label.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    const currentActive = activeCurrency || CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

    const alignmentClass = align === 'right'
        ? 'right-0'
        : align === 'left'
            ? 'left-0'
            : 'left-0 sm:left-auto sm:right-0';

    const popoverPositionClass = fullWidth
        ? 'w-full left-0 right-0'
        : `${alignmentClass} w-[260px] sm:w-72 max-w-[calc(100vw-3rem)]`;

    return (
        <div className={`relative ${fullWidth ? 'w-full block' : 'inline-block'} text-left z-50 font-sans`} ref={dropdownRef}>
            {/* Luxury Trigger Pill */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-label={`Current currency: ${currentActive.code}. Click to change.`}
                className={`group flex items-center ${fullWidth ? 'w-full justify-between' : 'gap-2'} px-3.5 py-2 bg-white hover:bg-stone-50 active:bg-stone-100 rounded-full border border-stone-200 shadow-sm hover:shadow transition-all duration-200 text-stone-800`}
            >
                <div className="flex items-center gap-2">
                    {/* Crisp SVG Country Flag */}
                    <span className="flex items-center shrink-0">
                        <CountryFlag code={currentActive.flag} className="w-4 h-3 rounded-[2px]" />
                    </span>

                    {/* Currency Code & Symbol */}
                    <span className="text-[12px] font-semibold tracking-tight text-stone-800 flex items-center gap-1">
                        <span>{currentActive.code}</span>
                        <span className="text-stone-400 font-normal text-[11px]">({currentActive.symbol})</span>
                    </span>
                </div>

                {/* Subtle Chevron Icon */}
                <svg
                    className={`w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Luxury Popover Menu (100% Solid Opaque White) */}
            {isOpen && (
                <div
                    className={`absolute top-full mt-2 ${popoverPositionClass} bg-white rounded-2xl shadow-2xl border border-stone-200 py-2.5 z-[9999] transition-all origin-top`}
                    style={{ backgroundColor: '#ffffff', opacity: 1 }}
                >
                    {/* Header with Title & Quick Search */}
                    <div className="px-3 pb-2 border-b border-stone-100">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
                                Select Currency
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">
                                {CURRENCIES.length} Available
                            </span>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search currency or country..."
                                className="w-full bg-stone-100/80 text-stone-800 placeholder-stone-400 text-xs rounded-lg pl-7 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-stone-900 border-none transition-all"
                            />
                            <svg
                                className="w-3.5 h-3.5 text-stone-400 absolute left-2 top-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-2 text-[10px] text-stone-400 hover:text-stone-700"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Scrollable Currency Items */}
                    <div className="max-h-64 overflow-y-auto py-1 px-1 divide-y divide-stone-50 scrollbar-thin">
                        {filteredCurrencies.length === 0 ? (
                            <div className="py-6 text-center text-xs text-stone-400">
                                No currency found
                            </div>
                        ) : (
                            filteredCurrencies.map((item) => {
                                const isSelected = currency === item.code;
                                return (
                                    <button
                                        key={item.code}
                                        onClick={() => {
                                            changeCurrency(item.code);
                                            setIsOpen(false);
                                            setSearchQuery('');
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${isSelected
                                            ? 'bg-stone-900 text-white shadow-sm'
                                            : 'hover:bg-stone-100 text-stone-800'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            {/* Crisp Flag Icon */}
                                            <CountryFlag code={item.flag} className="w-5 h-3.5 shrink-0 rounded-[2px]" />

                                            {/* Details */}
                                            <div className="truncate">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`text-xs font-bold tracking-wide ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                                                        {item.code}
                                                    </span>
                                                    <span className={`text-[10px] ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                                                        ({item.symbol})
                                                    </span>
                                                </div>
                                                <div className={`text-[11px] truncate ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                                                    {item.name}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Checkmark indicator for selected item */}
                                        {isSelected && (
                                            <svg
                                                className="w-4 h-4 text-emerald-400 shrink-0 ml-2"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
