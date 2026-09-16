'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FiSearch, FiX } from 'react-icons/fi';
import { supabase } from '../utils/supabase';
import { useGlobalCurrency } from '../context/CurrencyContext';

export default function LiveSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef(null);

    const { convertPrice } = useGlobalCurrency() || { convertPrice: (v) => `₹${v}` };

    // 🔥 बाहर क्लिक करने पर सर्च बार बंद करने का लॉजिक
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 🔥 Live Search API with Debounce (टाइप करते ही डेटाबेस से लाइव प्रोडक्ट लाना)
    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const fetchResults = async () => {
            setIsLoading(true);
            setIsOpen(true);

            // Supabase 'ilike' (Case-insensitive) सर्च
            const { data, error } = await supabase
                .from('products')
                .select('id, name, price, salePrice, onSale, images, image, category')
                .eq('status', 'active')
                .ilike('name', `%${query}%`)
                .limit(5); // सिर्फ टॉप 5 रिजल्ट्स दिखाएं

            if (!error && data) {
                setResults(data);
            }
            setIsLoading(false);
        };

        // यूज़र के टाइपिंग रोकने के 300ms बाद ही सर्च करें (ताकि सर्वर पर लोड न पड़े)
        const timeoutId = setTimeout(fetchResults, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    return (
        <div className="relative w-full max-w-xs" ref={searchRef}>
            {/* Search Input */}
            <div className="relative flex items-center">
                <FiSearch className="absolute left-4 text-stone-400" size={16} />
                <input
                    type="text"
                    placeholder="Search pieces..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-transparent rounded-full text-xs font-bold tracking-wide focus:outline-none focus:bg-white focus:border-stone-200 focus:ring-4 focus:ring-stone-100 transition-all text-stone-900 placeholder-stone-400"
                />
                {query && (
                    <button
                        onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}
                        className="absolute right-3 text-stone-400 hover:text-stone-900 transition-colors p-1"
                    >
                        <FiX size={14} />
                    </button>
                )}
            </div>

            {/* Dropdown Results Modal */}
            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-stone-100 rounded-3xl shadow-2xl overflow-hidden z-50 animate-fade-in flex flex-col">
                    {isLoading ? (
                        <div className="p-6 flex flex-col items-center justify-center">
                            <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin mb-3"></div>
                            <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400">Searching...</p>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="py-2">
                            <div className="px-4 py-2 border-b border-stone-100">
                                <p className="text-[9px] font-bold tracking-widest uppercase text-stone-400">Top Matches</p>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {results.map((product) => (
                                    <Link
                                        key={product.id}
                                        href={`/product/${product.id}`}
                                        onClick={() => { setIsOpen(false); setQuery(''); }}
                                        className="flex items-center gap-4 px-4 py-3 hover:bg-stone-50 transition-colors group"
                                    >
                                        <div className="w-12 h-14 bg-stone-100 rounded-md overflow-hidden flex-shrink-0 border border-stone-200/50">
                                            <img
                                                src={product.images?.[0] || product.image || 'https://via.placeholder.com/150'}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-stone-900 truncate">{product.name}</p>
                                            <p className="text-[9px] font-bold tracking-widest uppercase text-stone-400 mt-0.5">{product.category || 'Collection'}</p>
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className="text-xs font-bold text-stone-900">
                                                    {convertPrice(product.onSale ? product.salePrice : product.price)}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            <Link
                                href={`/shop?search=${query}`}
                                onClick={() => setIsOpen(false)}
                                className="block w-full px-4 py-3 bg-stone-50 text-center text-[10px] font-bold tracking-widest uppercase text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors border-t border-stone-100"
                            >
                                View All Results
                            </Link>
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <FiSearch className="mx-auto text-stone-200 mb-3" size={24} />
                            <p className="text-xs font-bold text-stone-900">No results found</p>
                            <p className="text-[10px] font-medium text-stone-400 mt-1">Try searching for something else.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}