'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiX, FiUser, FiHeart, FiBox, FiLogOut } from 'react-icons/fi';

// Components & Contexts
import CurrencySelector from '../CurrencySelector';
import { useWishlist } from '../../context/WishlistContext';

export default function MobileMenu({ onClose }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const { wishlistCount } = useWishlist() || { wishlistCount: 0 };

  // Fetch user state on mount
  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  // Handle Sign Out from Mobile
  const handleSignOut = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    window.dispatchEvent(new Event('userStateChange'));
    onClose();
    router.push('/');
  };

  return (
    <div className="fixed inset-0 z-[100] flex animate-fade-in">
      {/* Dark Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Sidebar Panel */}
      <div className="absolute top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col transform transition-transform duration-300">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-100">
          <span className="text-2xl font-extrabold text-stone-900 tracking-tighter">
            ShopHub<span className="text-stone-400">.</span>
          </span>
          <button
            onClick={onClose}
            className="p-2.5 text-stone-400 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 rounded-full transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-6 px-6 flex flex-col gap-8 hide-scrollbar">

          {/* Currency Selector Added Here */}
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-3">Preferences</p>
            <CurrencySelector />
          </div>

          {/* Main Navigation */}
          <nav className="flex flex-col gap-5">
            <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-1">Menu</p>
            <Link href="/shop?filter=new-arrivals" onClick={onClose} className="text-xl font-light text-stone-900">New In</Link>
            <Link href="/shop" onClick={onClose} className="text-xl font-light text-stone-900">Shop All</Link>
            <Link href="/categories" onClick={onClose} className="text-xl font-light text-stone-900">Collections</Link>
            <Link href="/about" onClick={onClose} className="text-xl font-light text-stone-900">Journal</Link>
            <Link href="/contact" onClick={onClose} className="text-xl font-light text-stone-900">Support</Link>
          </nav>

          {/* User & Actions Section */}
          <div className="mt-auto pt-8 border-t border-stone-100">
            <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-5">Account & Saved</p>

            {/* CONDITIONAL RENDER: Logged In vs Logged Out */}
            {currentUser ? (
              <div className="flex flex-col gap-5">
                {/* User Profile Card */}
                <div className="flex items-center gap-3 mb-2 bg-stone-50 p-3 rounded-2xl border border-stone-100">
                  <div className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center overflow-hidden shadow-sm">
                    {currentUser.image ? (
                      <img src={currentUser.image} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                      <span className="font-serif italic font-bold text-stone-900 text-lg">
                        {currentUser.firstName?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-stone-900 truncate">{currentUser.firstName} {currentUser.lastName}</p>
                    <p className="text-[10px] text-stone-500 truncate">{currentUser.email}</p>
                  </div>
                </div>

                <Link href="/account" onClick={onClose} className="flex items-center gap-3 text-sm font-medium text-stone-600 hover:text-stone-900">
                  <FiUser size={18} className="text-stone-400" /> My Profile
                </Link>
                <Link href="/account?tab=orders" onClick={onClose} className="flex items-center gap-3 text-sm font-medium text-stone-600 hover:text-stone-900">
                  <FiBox size={18} className="text-stone-400" /> Order History
                </Link>
                <Link href="/wishlist" onClick={onClose} className="flex items-center gap-3 text-sm font-medium text-stone-600 hover:text-stone-900">
                  <FiHeart size={18} className="text-stone-400" /> Wishlist
                  {wishlistCount > 0 && (
                    <span className="bg-stone-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-full ml-auto">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <button onClick={handleSignOut} className="flex items-center gap-3 text-sm font-bold text-red-500 mt-3 pt-4 border-t border-stone-50">
                  <FiLogOut size={18} /> Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <Link href="/login" onClick={onClose} className="w-full bg-stone-900 text-white text-center text-xs font-bold tracking-widest uppercase py-3.5 rounded-full shadow-lg shadow-stone-900/10">
                  Sign In
                </Link>
                <Link href="/register" onClick={onClose} className="w-full bg-white border border-stone-200 text-stone-900 text-center text-xs font-bold tracking-widest uppercase py-3.5 rounded-full">
                  Create Account
                </Link>

                <Link href="/wishlist" onClick={onClose} className="flex items-center gap-3 text-sm font-medium text-stone-600 hover:text-stone-900 mt-4">
                  <FiHeart size={18} className="text-stone-400" /> Wishlist
                  {wishlistCount > 0 && (
                    <span className="bg-stone-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-full ml-auto">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}