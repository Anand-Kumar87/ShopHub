'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiX, FiShoppingBag, FiMinus, FiPlus } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useGlobalCurrency } from '../../context/CurrencyContext'; // 🔥 Added Currency Context

export default function CartDropdown() {
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice, closeCart } = useCart();
  const [isClosing, setIsClosing] = useState(false);

  // Get dynamic currency formatting
  const { convertPrice } = useGlobalCurrency() || { convertPrice: (v) => `₹${Number(v).toFixed(2)}` };

  // Smooth close logic
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      closeCart();
    }, 300); // Matches transition duration
  };

  // Escape key listener
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">

      {/* Premium Backdrop Overlay */}
      <div
        className={`absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Slide-in Cart Panel */}
      <div
        className={`relative w-full max-w-md bg-white h-full shadow-2xl overflow-hidden transform transition-transform duration-300 ease-out flex flex-col ${isClosing ? 'translate-x-full' : 'translate-x-0'}`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <h2 className="text-2xl font-light text-stone-900 tracking-tight flex items-center gap-2">
            Your <span className="font-serif italic font-bold">Bag</span>
            <span className="text-xs font-bold bg-stone-100 text-stone-900 px-2.5 py-1 rounded-full ml-1">
              {cartItems.length}
            </span>
          </h2>
          <button
            onClick={handleClose}
            className="p-2.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors"
            aria-label="Close cart"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-grow overflow-y-auto hide-scrollbar">
          {cartItems.length > 0 ? (
            <ul className="divide-y divide-stone-100">
              {cartItems.map((item) => {
                // Determine image source correctly from database structure
                const itemImage = item.images?.[0] || item.image;

                // 🔥 Fix: Ensure price is treated as a number
                const safeItemPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;

                return (
                  <li key={item.id} className="p-6 transition-colors hover:bg-stone-50/50 group flex gap-5">

                    {/* Product Image (Premium 3:4 Ratio) */}
                    <div className="flex-shrink-0 w-24 aspect-[3/4] bg-stone-100 rounded-lg overflow-hidden relative border border-stone-200/60">
                      {itemImage ? (
                        <Image
                          src={itemImage.startsWith('data:') ? itemImage : `${itemImage}?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80`}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <FiShoppingBag size={24} />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-grow flex flex-col">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h3 className="text-sm font-bold text-stone-900 line-clamp-2 leading-tight">
                          {item.name}
                        </h3>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-stone-400 hover:text-red-500 transition-colors p-1"
                          aria-label="Remove item"
                        >
                          <FiX size={18} />
                        </button>
                      </div>

                      <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-auto">
                        {item.category || 'Collection'}
                      </p>

                      <div className="flex items-center justify-between mt-4">
                        {/* Premium Pill Quantity Control */}
                        <div className="flex items-center border border-stone-200 rounded-full bg-white h-9">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-full flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors disabled:opacity-30"
                            disabled={item.quantity <= 1}
                          >
                            <FiMinus size={12} />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-stone-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-full flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors"
                          >
                            <FiPlus size={12} />
                          </button>
                        </div>

                        <span className="text-sm font-bold text-stone-900">
                          {convertPrice(safeItemPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            /* Premium Empty State */
            <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
              <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6">
                <FiShoppingBag size={32} className="text-stone-300" />
              </div>
              <h3 className="text-xl font-light text-stone-900 mb-2 tracking-tight">Your bag is empty</h3>
              <p className="text-stone-500 text-sm mb-8 max-w-[250px]">
                Discover our latest collections and find your new favorites.
              </p>
              <button
                onClick={handleClose}
                className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold tracking-widest uppercase py-4 px-10 rounded-full shadow-lg shadow-stone-900/10 transition-colors"
              >
                Start Shopping
              </button>
            </div>
          )}
        </div>

        {/* Footer / Checkout Section */}
        {cartItems.length > 0 && (
          <div className="border-t border-stone-100 p-6 bg-white sticky bottom-0">
            <div className="flex justify-between items-end mb-4">
              <span className="text-xs font-bold tracking-widest uppercase text-stone-500">Subtotal</span>
              <span className="text-2xl font-bold text-stone-900">
                {convertPrice(getTotalPrice())}
              </span>
            </div>
            <p className="text-xs text-stone-500 mb-6">
              Shipping and taxes calculated at checkout.
            </p>
            <div className="space-y-3">
              <Link
                href="/checkout"
                onClick={handleClose}
                className="flex items-center justify-center w-full bg-stone-900 hover:bg-stone-800 text-white font-bold tracking-widest uppercase text-xs py-4 rounded-full transition-colors shadow-xl shadow-stone-900/20"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
