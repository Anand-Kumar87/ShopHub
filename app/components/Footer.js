'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaFacebookF, FaTwitter, FaInstagram, FaYoutube, FaPinterestP } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    try {
      // 🔥 REAL API CALL TO NEWSLETTER BACKEND
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) throw new Error("Subscription failed");

      toast.success("Welcome to the club! You've successfully subscribed.", { icon: '🎉' });
      setEmail(''); // Clear the input field
    } catch (error) {
      console.error("Newsletter Error:", error);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-stone-950 text-stone-400 pt-20 pb-8 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Premium Newsletter Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-stone-800 pb-16 mb-16 gap-8">
          <div className="max-w-md">
            <h2 className="text-3xl text-white font-light tracking-tight mb-3">
              Join the <span className="font-serif italic font-bold">Club</span>
            </h2>
            <p className="text-sm text-stone-400 leading-relaxed">
              Subscribe for exclusive early access to sales, new arrivals, and style inspiration directly to your inbox.
            </p>
          </div>

          <form
            onSubmit={handleSubscribe}
            className="flex w-full md:w-auto relative group mt-4 md:mt-0"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              disabled={isSubmitting}
              className="bg-transparent border-b border-stone-700 py-3 pr-[100px] text-white focus:outline-none focus:border-transparent transition-colors w-full md:w-[320px] placeholder-stone-600 disabled:opacity-50 text-sm peer"
            />

            {/* Premium Animated Bottom Line on Focus */}
            <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-500 ease-out peer-focus:w-full"></div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="absolute right-0 top-0 bottom-0 flex items-center text-white text-[10px] font-bold tracking-widest uppercase hover:text-stone-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Joining...</span>
              ) : (
                'Subscribe'
              )}
            </button>
          </form>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-16">

          {/* Brand Info */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link href="/" className="text-2xl font-extrabold text-white tracking-tight block mb-6">
              ShopHub<span className="text-stone-500">.</span>
            </Link>
            <p className="text-sm text-stone-400 mb-8 leading-relaxed max-w-xs">
              Trendy pieces. Timeless style. Your one-stop destination for quality products that make you look and feel your best.
            </p>
            {/* Social Icons */}
            <div className="flex space-x-5">
              <a href="#" className="text-stone-500 hover:text-white transition-colors duration-300" aria-label="Facebook">
                <FaFacebookF size={18} />
              </a>
              <a href="#" className="text-stone-500 hover:text-white transition-colors duration-300" aria-label="Twitter">
                <FaTwitter size={18} />
              </a>
              <a href="#" className="text-stone-500 hover:text-white transition-colors duration-300" aria-label="Instagram">
                <FaInstagram size={18} />
              </a>
              <a href="#" className="text-stone-500 hover:text-white transition-colors duration-300" aria-label="Youtube">
                <FaYoutube size={18} />
              </a>
              <a href="#" className="text-stone-500 hover:text-white transition-colors duration-300" aria-label="Pinterest">
                <FaPinterestP size={18} />
              </a>
            </div>
          </div>

          {/* Shop Categories */}
          <div>
            <h3 className="text-xs font-bold text-white tracking-widest uppercase mb-6">Shop</h3>
            <ul className="space-y-4 text-sm">
              <li><Link href="/shop?filter=new-arrivals" className="hover:text-white transition-colors duration-200">New Arrivals</Link></li>
              <li><Link href="/shop?filter=best-sellers" className="hover:text-white transition-colors duration-200">Best Sellers</Link></li>
              <li><Link href="/shop" className="hover:text-white transition-colors duration-200">All Collections</Link></li>
              <li><Link href="/shop?sale=true" className="hover:text-white transition-colors duration-200">Sale & Offers</Link></li>
              <li><Link href="/categories" className="hover:text-white transition-colors duration-200">Categories</Link></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h3 className="text-xs font-bold text-white tracking-widest uppercase mb-6">Support</h3>
            <ul className="space-y-4 text-sm">
              <li><Link href="/contact" className="hover:text-white transition-colors duration-200">Contact Us</Link></li>
              <li><Link href="/shipping" className="hover:text-white transition-colors duration-200">Shipping Info</Link></li>
              <li><Link href="/returns" className="hover:text-white transition-colors duration-200">Returns & Exchanges</Link></li>
              <li><Link href="/faqs" className="hover:text-white transition-colors duration-200">FAQs</Link></li>
              <li><Link href="/size-guide" className="hover:text-white transition-colors duration-200">Size Guide</Link></li>
            </ul>
          </div>

          {/* Company Info */}
          <div>
            <h3 className="text-xs font-bold text-white tracking-widest uppercase mb-6">Company</h3>
            <ul className="space-y-4 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors duration-200">Our Story</Link></li>
              <li><Link href="/careers" className="hover:text-white transition-colors duration-200">Careers</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors duration-200">Journal / Blog</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors duration-200">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors duration-200">Terms of Service</Link></li>
            </ul>
          </div>

        </div>

        {/* 🔥 PERFECTLY CENTERED BOTTOM BAR */}
        <div className="border-t border-stone-800 pt-8 pb-4 flex flex-col md:flex-row justify-between items-center gap-6 relative">

          {/* 1. Copyright (Left Aligned on Desktop) */}
          <div className="text-xs text-stone-500 md:w-1/3 text-center md:text-left">
            <p>&copy; {new Date().getFullYear()} ShopHub. Designed for excellence.</p>
          </div>

          {/* 2. Your Name Badge (Dead Center) with Luxury Animation */}
          <div className="md:w-1/3 flex justify-center">
            <div className="group relative inline-flex items-center justify-center gap-2 bg-stone-900/50 px-6 py-2.5 rounded-full border border-stone-800 hover:border-stone-600 transition-all duration-500 cursor-pointer overflow-hidden shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:-translate-y-1">

              {/* Animated Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-stone-800/0 via-stone-600/10 to-stone-800/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>

              <span className="text-sm relative z-10 group-hover:scale-110 transition-transform duration-300">👨‍💻</span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-stone-500 relative z-10 transition-colors duration-300 group-hover:text-stone-400">
                Developed By <span className="text-stone-300 group-hover:text-white ml-1 transition-colors duration-300">Anand Kumar (Nobita)</span>
              </span>
            </div>
          </div>

          {/* 3. Payment Methods (Right Aligned on Desktop) */}
          <div className="flex flex-wrap justify-center md:justify-end gap-3 md:w-1/3">
            <img src="/icons/visa.svg" alt="Visa" className="h-7 bg-white rounded px-1.5 grayscale hover:grayscale-0 transition-all duration-300 opacity-70 hover:opacity-100" />
            <img src="/icons/mastercard.svg" alt="Mastercard" className="h-7 bg-white rounded px-1.5 grayscale hover:grayscale-0 transition-all duration-300 opacity-70 hover:opacity-100" />
            <img src="/icons/paypal.svg" alt="PayPal" className="h-7 bg-white rounded px-1.5 grayscale hover:grayscale-0 transition-all duration-300 opacity-70 hover:opacity-100" />
            <img src="/icons/apple-pay.svg" alt="Apple-Pay" className="h-7 bg-white rounded px-1.5 grayscale hover:grayscale-0 transition-all duration-300 opacity-70 hover:opacity-100" />
          </div>

        </div>
      </div>
    </footer>
  );
}