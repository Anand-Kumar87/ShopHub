'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiX } from 'react-icons/fi';

export default function SearchBar({ onClose }) {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const inputRef = useRef(null);

  // Auto-focus input aur scroll lock handle karna
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }

    document.body.style.overflow = 'hidden';

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/shop?search=${encodeURIComponent(query)}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col animate-fade-in">

      {/* Background Overlay (Click to close) */}
      <div
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Top Search Panel */}
      <div className="relative w-full bg-white shadow-2xl rounded-b-3xl pt-6 pb-8 transform transition-transform">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between gap-4">

            {/* Search Input Area */}
            <form onSubmit={handleSearch} className="flex-1 flex items-center relative">
              <FiSearch className="absolute left-5 text-stone-400 w-6 h-6" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, brands, or categories..."
                className="w-full bg-stone-100 text-stone-900 text-lg md:text-xl rounded-full py-4 pl-14 pr-32 outline-none focus:bg-stone-200/50 transition-colors placeholder-stone-400"
              />

              {/* Search Button inside input */}
              <button
                type="submit"
                className="hidden sm:block absolute right-2 bg-stone-900 text-white text-sm font-bold px-6 py-2.5 rounded-full hover:bg-stone-800 transition-colors"
              >
                Search
              </button>
            </form>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-3 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors flex-shrink-0"
              aria-label="Close search"
            >
              <FiX className="w-7 h-7" />
            </button>
          </div>

          {/* Trending Searches */}
          <div className="mt-6 pl-4 flex flex-wrap items-center gap-4 text-sm">
            <span className="text-stone-400 font-bold text-xs uppercase tracking-widest">Trending:</span>
            <button type="button" onClick={() => setQuery('Dresses')} className="text-stone-600 hover:text-stone-900 font-medium transition-colors">Dresses</button>
            <button type="button" onClick={() => setQuery('Oversized')} className="text-stone-600 hover:text-stone-900 font-medium transition-colors">Oversized</button>
            <button type="button" onClick={() => setQuery('Sneakers')} className="text-stone-600 hover:text-stone-900 font-medium transition-colors">Sneakers</button>
            <button type="button" onClick={() => setQuery('Bags')} className="text-stone-600 hover:text-stone-900 font-medium transition-colors">Bags</button>
          </div>

        </div>
      </div>

    </div>
  );
}