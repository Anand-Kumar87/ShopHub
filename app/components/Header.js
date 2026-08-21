'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { FiSearch, FiUser, FiShoppingCart, FiHeart, FiMenu, FiX, FiBox, FiLogOut, FiArrowRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion'; // 🔥 IMPORTED FRAMER MOTION

// Components 
import SearchBar from './common/SearchBar';
import CurrencySelector from './CurrencySelector';
import MobileMenu from './common/MobileMenu';
import CartDropdown from './cart/CartDropdown';

// Global Contexts 
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function Header() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // 🔥 NEW: State to control Mega Menu visibility
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  let timeoutId = useRef(null); // To add a slight delay for smooth hover experience

  // 1. Context Hooks (with safety fallbacks)
  const { getTotalItems, openCart, isCartOpen } = useCart() || { getTotalItems: () => 0, openCart: () => { }, isCartOpen: false };
  const { wishlistCount } = useWishlist() || { wishlistCount: 0 };

  // 2. Auth & Dropdown States
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const dropdownRef = useRef(null);
  const headerRef = useRef(null);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const toggleSearch = () => setSearchOpen(!searchOpen);

  // 3. Effects for Scroll, Auth Sync, and Click Outside
  useEffect(() => {
    // Scroll Effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    // Check User Logic
    const checkUser = () => {
      const userStr = localStorage.getItem('currentUser');
      setCurrentUser(userStr ? JSON.parse(userStr) : null);
    };

    // Click outside to close user dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };

    // Initial checks and Event Listeners
    checkUser();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('storage', checkUser);
    window.addEventListener('userStateChange', checkUser);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('userStateChange', checkUser);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 4. Sign Out Handler
  const handleSignOut = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setIsUserDropdownOpen(false);
    window.dispatchEvent(new Event('userStateChange'));
    router.push('/');
  };

  // 🔥 HANDLERS FOR MEGA MENU HOVER
  const handleMouseEnterMegaMenu = () => {
    clearTimeout(timeoutId.current);
    setIsMegaMenuOpen(true);
  };

  const handleMouseLeaveMegaMenu = () => {
    timeoutId.current = setTimeout(() => {
      setIsMegaMenuOpen(false);
    }, 150); // 150ms delay makes it feel natural, not jerky
  };

  return (
    <>
      <header
        ref={headerRef}
        className={`sticky top-0 z-50 transition-all duration-500 ease-in-out ${scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-stone-200/50 py-4'
          : 'bg-white py-6'
          } ${isMegaMenuOpen && !scrolled ? 'bg-white' : ''}`} // Keep background white when menu is open
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">

            {/* Premium Minimalist Logo */}
            <Link href="/" className="text-3xl font-extrabold text-stone-900 tracking-tighter flex items-baseline relative z-10">
              ShopHubStyle<span className="text-stone-400 text-4xl leading-none">.</span>
            </Link>

            {/* Desktop Navigation (Premium Typography) */}
            <nav className="hidden md:flex items-center space-x-10 h-full relative z-10">
              <Link href="/shop?filter=new-arrivals" className="text-xs font-bold tracking-widest uppercase text-stone-500 hover:text-stone-900 transition-colors duration-300 py-2">New In</Link>
              <Link href="/shop" className="text-xs font-bold tracking-widest uppercase text-stone-500 hover:text-stone-900 transition-colors duration-300 py-2">Shop</Link>

              {/* 🔥 COLLECTIONS LINK WITH MEGA MENU TRIGGER */}
              <div
                className="h-full flex items-center py-2"
                onMouseEnter={handleMouseEnterMegaMenu}
                onMouseLeave={handleMouseLeaveMegaMenu}
              >
                <Link
                  href="/categories"
                  className={`text-xs font-bold tracking-widest uppercase transition-colors duration-300 ${isMegaMenuOpen ? 'text-stone-900' : 'text-stone-500 hover:text-stone-900'}`}
                >
                  Collections
                </Link>
              </div>

              <Link href="/about" className="text-xs font-bold tracking-widest uppercase text-stone-500 hover:text-stone-900 transition-colors duration-300 py-2">Journal</Link>
              <Link href="/contact" className="text-xs font-bold tracking-widest uppercase text-stone-500 hover:text-stone-900 transition-colors duration-300 py-2">Support</Link>
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-1 sm:space-x-3 relative z-10">

              {/* --- Currency Selector Added Here --- */}
              <div className="hidden sm:block mr-2">
                <CurrencySelector />
              </div>

              {/* Search */}
              <button
                type="button"
                className="p-2.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-all duration-300"
                onClick={toggleSearch}
                aria-label="Search"
              >
                <FiSearch className="w-5 h-5" />
              </button>

              {/* Wishlist Button with Premium Dark Badge */}
              <Link
                href="/wishlist"
                className="relative p-2.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-all duration-300 hidden sm:flex"
                aria-label="Wishlist"
              >
                <FiHeart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 bg-stone-900 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white transform translate-x-1 -translate-y-0.5 shadow-sm">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* --- PREMIUM USER DROPDOWN SECTION (Fixed) --- */}
              <div className="relative hidden sm:block" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="p-2.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-all duration-300 flex items-center justify-center"
                  aria-label="User Menu"
                >
                  {currentUser?.image ? (
                    <img src={currentUser.image} alt="Profile" className="w-6 h-6 rounded-full object-cover border border-stone-200" />
                  ) : (
                    <FiUser className="w-5 h-5" />
                  )}
                </button>

                {/* Dropdown Box */}
                <div className={`absolute right-0 top-full mt-2 w-72 bg-white border border-stone-100 rounded-2xl shadow-2xl shadow-stone-900/10 transform transition-all duration-300 origin-top-right ${isUserDropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
                  <div className="p-6">

                    {/* IF USER IS LOGGED IN */}
                    {currentUser ? (
                      <>
                        <div className="flex items-center gap-4 mb-6 bg-stone-50 p-4 rounded-xl border border-stone-100">
                          <div className="w-12 h-12 rounded-full bg-white border border-stone-200 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
                            {currentUser.image ? (
                              <img src={currentUser.image} className="w-full h-full object-cover" alt="Avatar" />
                            ) : (
                              <span className="font-serif italic font-bold text-stone-900 text-lg">
                                {currentUser.firstName?.charAt(0) || 'U'}
                              </span>
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-sm font-bold text-stone-900 truncate">
                              {currentUser.firstName} {currentUser.lastName}
                            </p>
                            <p className="text-[10px] text-stone-500 truncate tracking-wide">
                              {currentUser.email}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1 mb-6">
                          <Link href="/account" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors">
                            <FiUser size={16} /> My Account
                          </Link>
                          <Link href="/account?tab=orders" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors">
                            <FiBox size={16} /> Order History
                          </Link>
                        </div>

                        <button type="button" onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 text-xs font-bold tracking-widest uppercase text-stone-500 border border-stone-200 py-3 rounded-full hover:bg-stone-50 hover:text-stone-900 transition-colors">
                          <FiLogOut size={14} /> Sign Out
                        </button>
                      </>
                    ) : (
                      /* IF USER IS NOT LOGGED IN (GUEST) */
                      <>
                        <div className="text-center mb-6">
                          <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2 block">Welcome</span>
                          <h3 className="text-lg font-light text-stone-900">Access your <span className="font-serif italic font-bold">Profile</span></h3>
                        </div>

                        <div className="flex flex-col gap-3 mb-6">
                          <Link href="/login" onClick={() => setIsUserDropdownOpen(false)} className="w-full bg-stone-900 text-white text-center text-xs font-bold tracking-widest uppercase py-3.5 rounded-full hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/10 block">
                            Sign In
                          </Link>
                          <Link href="/register" onClick={() => setIsUserDropdownOpen(false)} className="w-full bg-white border border-stone-200 text-stone-900 text-center text-xs font-bold tracking-widest uppercase py-3.5 rounded-full hover:bg-stone-50 transition-colors block">
                            Create Account
                          </Link>
                        </div>

                        <div className="border-t border-stone-100 pt-4 space-y-1">
                          <Link href="/account?viewOrder=track" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors block">
                            <div className="flex items-center gap-3"><FiBox size={16} /> Track an Order</div>
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* --- END PREMIUM USER DROPDOWN --- */}

              {/* Shopping Cart Button */}
              <button
                type="button"
                className="relative p-2.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-all duration-300"
                onClick={openCart}
                aria-label="Shopping Cart"
              >
                <FiShoppingCart className="w-5 h-5" />
                {getTotalItems() > 0 && (
                  <span className="absolute top-0 right-0 bg-stone-900 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white transform translate-x-1 -translate-y-0.5 shadow-sm">
                    {getTotalItems()}
                  </span>
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                className="p-2.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-all duration-300 md:hidden"
                onClick={toggleMobileMenu}
                aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              >
                {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* 🔥 LUXURY MEGA MENU (FRAMER MOTION) */}
        <AnimatePresence>
          {isMegaMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute top-full left-0 w-full bg-white border-t border-stone-100 shadow-xl shadow-stone-900/5 hidden md:block"
              onMouseEnter={handleMouseEnterMegaMenu}
              onMouseLeave={handleMouseLeaveMegaMenu}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex gap-12">

                  {/* Column 1: Categories */}
                  <div className="w-1/4 pr-8 border-r border-stone-100">
                    <h3 className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-6">Explore By Category</h3>
                    <ul className="space-y-4">
                      <li><Link href="/shop?category=traditional" onClick={() => setIsMegaMenuOpen(false)} className="text-sm font-medium text-stone-600 hover:text-stone-900 hover:pl-2 transition-all duration-300">Traditional Attire</Link></li>
                      <li><Link href="/shop?category=modern" onClick={() => setIsMegaMenuOpen(false)} className="text-sm font-medium text-stone-600 hover:text-stone-900 hover:pl-2 transition-all duration-300">Modern Casuals</Link></li>
                      <li><Link href="/shop?category=bridal" onClick={() => setIsMegaMenuOpen(false)} className="text-sm font-medium text-stone-600 hover:text-stone-900 hover:pl-2 transition-all duration-300">Bridal & Wedding</Link></li>
                      <li><Link href="/shop?category=accessories" onClick={() => setIsMegaMenuOpen(false)} className="text-sm font-medium text-stone-600 hover:text-stone-900 hover:pl-2 transition-all duration-300">Luxury Accessories</Link></li>
                      <li><Link href="/shop" onClick={() => setIsMegaMenuOpen(false)} className="text-xs font-bold uppercase tracking-widest text-stone-900 mt-2 block border-b border-stone-900 w-max pb-0.5">View All Pieces</Link></li>
                    </ul>
                  </div>

                  {/* Column 2: Editorial / Features */}
                  <div className="w-1/4 pr-8 border-r border-stone-100">
                    <h3 className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-6">Curated For You</h3>
                    <ul className="space-y-4">
                      <li><Link href="/shop?filter=new-arrivals" onClick={() => setIsMegaMenuOpen(false)} className="text-sm font-medium text-stone-600 hover:text-stone-900 flex items-center gap-2 transition-colors"><span className="w-1.5 h-1.5 bg-stone-900 rounded-full"></span> New Season Arrivals</Link></li>
                      <li><Link href="/shop?filter=best-sellers" onClick={() => setIsMegaMenuOpen(false)} className="text-sm font-medium text-stone-600 hover:text-stone-900 flex items-center gap-2 transition-colors"><span className="w-1.5 h-1.5 bg-stone-300 rounded-full"></span> Best Sellers</Link></li>
                      <li><Link href="/shop?sale=true" onClick={() => setIsMegaMenuOpen(false)} className="text-sm font-bold text-red-600 hover:text-red-700 flex items-center gap-2 transition-colors"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> Sale & Offers</Link></li>
                      <li><Link href="/about" onClick={() => setIsMegaMenuOpen(false)} className="text-sm font-medium text-stone-600 hover:text-stone-900 flex items-center gap-2 transition-colors"><span className="w-1.5 h-1.5 bg-stone-300 rounded-full"></span> Brand Story</Link></li>
                    </ul>
                  </div>

                  {/* Column 3 & 4: Featured Image Banners */}
                  <div className="w-2/4 flex gap-6">
                    <Link href="/shop?category=bridal" onClick={() => setIsMegaMenuOpen(false)} className="relative w-1/2 aspect-[4/3] rounded-2xl overflow-hidden group bg-stone-100">
                      <img
                        src="/image (1).png"
                        alt="Bridal Collection"
                        className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent"></div>
                      <div className="absolute bottom-6 left-6 right-6">
                        <h4 className="text-white font-serif italic text-xl mb-1">Bridal Edit</h4>
                        <p className="text-stone-200 text-xs font-bold tracking-widest uppercase flex items-center gap-2">Discover <FiArrowRight /></p>
                      </div>
                    </Link>

                    <Link href="/shop?filter=new-arrivals" onClick={() => setIsMegaMenuOpen(false)} className="relative w-1/2 aspect-[4/3] rounded-2xl overflow-hidden group bg-stone-100">
                      <img
                        src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=500&q=80"
                        alt="New Season"
                        className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent"></div>
                      <div className="absolute bottom-6 left-6 right-6">
                        <h4 className="text-white font-serif italic text-xl mb-1">The New Look</h4>
                        <p className="text-stone-200 text-xs font-bold tracking-widest uppercase flex items-center gap-2">Shop Now <FiArrowRight /></p>
                      </div>
                    </Link>
                  </div>

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* CartDropdown Conditional Render */}
      {isCartOpen && <CartDropdown />}

      {/* Mobile Menu Conditional Render */}
      {mobileMenuOpen && (
        <MobileMenu onClose={() => setMobileMenuOpen(false)} />
      )}

      {/* Search Bar Conditional Render */}
      {searchOpen && (
        <SearchBar onClose={() => setSearchOpen(false)} />
      )}
    </>
  );
}
