'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import {
    FiX, FiStar, FiHeart, FiShoppingBag, FiMinus, FiPlus,
    FiArrowRight, FiTruck, FiShield, FiZap
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import { useGlobalCurrency } from '../../context/CurrencyContext';
import { useWishlist } from '../../context/WishlistContext';
import { resolveSwatchColor, resolveColorLabel } from '../../utils/colorUtils';
import { useRouter } from 'next/navigation';

export default function QuickViewModal({ product, onClose }) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const { addToCart, closeCart } = useCart() || {};
    const { convertPrice } = useGlobalCurrency() || { convertPrice: (v) => `₹${Number(v).toFixed(2)}` };
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist() || { isInWishlist: () => false };

    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const [selectedColor, setSelectedColor] = useState(() => product?.colors?.[0] || '');
    const [selectedSize, setSelectedSize] = useState(() => product?.sizes?.[0] || '');
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('details');
    const [isAdding, setIsAdding] = useState(false);

    const isWishlisted = product ? isInWishlist(product.id) : false;
    const isOutOfStock = (product?.stock <= 0 || product?.quantity <= 0);

    const safeImages = Array.isArray(product?.images) && product.images.length > 0
        ? product.images
        : [product?.image || product?.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'];

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Prevent background page scrolling when modal is active
    useEffect(() => {
        const originalStyle = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalStyle || '';
        };
    }, []);

    if (!mounted || !product) return null;

    const handleWishlistToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!product) return;

        if (isWishlisted) {
            removeFromWishlist(product.id);
            toast.success('Removed from Wishlist', { icon: '💔' });
        } else {
            addToWishlist(product);
            toast.success('Saved to Wishlist!', { icon: '❤️', style: { background: '#fef2f2', color: '#991b1b' } });
        }
    };

    const handleAdd = () => {
        if (!product || isOutOfStock) return;
        if (product.sizes?.length > 0 && !selectedSize) {
            return toast.error("Please select a size first.");
        }

        setIsAdding(true);
        addToCart({
            ...product,
            color: selectedColor,
            size: selectedSize
        }, quantity);

        toast.success(
            <div className="flex flex-col">
                <span className="font-bold">{product.name}</span>
                <span className="text-xs text-stone-500">Added {quantity} item(s) to bag</span>
            </div>,
            { icon: '🛍️' }
        );

        setTimeout(() => {
            setIsAdding(false);
            onClose();
        }, 350);
    };

    const handleBuyNow = () => {
        if (!product || isOutOfStock) return;
        if (product.sizes?.length > 0 && !selectedSize) {
            return toast.error("Please select a size first.");
        }

        addToCart({
            ...product,
            color: selectedColor,
            size: selectedSize
        }, quantity);

        if (closeCart) closeCart();
        onClose();
        router.push('/checkout');
    };

    const currentPrice = Number(product?.salePrice || product?.price || 0);
    const originalPrice = Number(product?.oldPrice || (product?.salePrice && product?.price > product?.salePrice ? product?.price : 0));
    const discountPercent = originalPrice > currentPrice
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0;

    const modalContent = (
        <div className="fixed inset-0 z-[999999] overflow-y-auto bg-stone-900/60 backdrop-blur-sm animate-fade-in">
            {/* Centering / Bottom-alignment scroll container */}
            <div
                className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 text-center"
                onClick={onClose}
            >
                {/* Modal Card */}
                <div
                    className="relative w-full sm:max-w-4xl lg:max-w-5xl bg-white rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl text-left overflow-y-auto md:overflow-hidden flex flex-col md:flex-row my-0 sm:my-6 border border-stone-100 max-h-[92vh] md:max-h-[85vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Mobile Top Drag Indicator */}
                    <div className="sm:hidden w-full flex justify-center pt-3 pb-1 bg-white">
                        <div className="w-12 h-1.5 bg-stone-300 rounded-full"></div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 sm:w-10 sm:h-10 bg-white/95 hover:bg-stone-100 text-stone-700 hover:text-stone-900 rounded-full flex items-center justify-center transition-all z-30 shadow-md border border-stone-200"
                        aria-label="Close modal"
                    >
                        <FiX size={18} />
                    </button>

                    {/* LEFT: IMAGE & THUMBNAILS */}
                    <div className="w-full md:w-1/2 p-4 sm:p-6 bg-stone-50/80 border-b md:border-b-0 md:border-r border-stone-100 flex flex-col justify-between shrink-0 md:overflow-y-auto hide-scrollbar">
                        <div>
                            {/* Main Image */}
                            <div className="relative w-full aspect-[4/3] sm:aspect-square md:aspect-[4/5] max-h-[260px] sm:max-h-[340px] md:max-h-[400px] bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200/60 group">
                                <Image
                                    src={safeImages[activeImageIdx]}
                                    alt={product.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    priority
                                />

                                {/* Wishlist Button */}
                                <button
                                    onClick={handleWishlistToggle}
                                    className={`absolute top-3 left-3 p-2.5 rounded-full shadow-md backdrop-blur-md transition-all z-10 ${
                                        isWishlisted ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-white/90 text-stone-500 hover:text-rose-600 border border-stone-200'
                                    }`}
                                    aria-label="Wishlist"
                                >
                                    <FiHeart size={16} className={isWishlisted ? "fill-current text-rose-500" : ""} />
                                </button>

                                {/* Discount Badge */}
                                {discountPercent > 0 && (
                                    <span className="absolute bottom-3 left-3 bg-stone-900 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                                        -{discountPercent}% OFF
                                    </span>
                                )}
                            </div>

                            {/* Gallery Thumbnail Selectors (Visible on Mobile & Desktop) */}
                            {safeImages.length > 1 && (
                                <div className="mt-3">
                                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                                        {safeImages.map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveImageIdx(idx)}
                                                className={`relative w-14 h-16 sm:w-16 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                                                    activeImageIdx === idx
                                                        ? 'border-stone-900 shadow-md ring-2 ring-stone-900/20 scale-95'
                                                        : 'border-transparent opacity-60 hover:opacity-100'
                                                }`}
                                            >
                                                <Image src={img} alt={`thumb-${idx}`} fill sizes="64px" className="object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Trust Pillars */}
                        <div className="hidden md:grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-stone-200/60 text-xs text-stone-600">
                            <div className="flex items-center gap-1.5">
                                <FiTruck className="text-stone-900 shrink-0" size={14} />
                                <span>Express Delivery</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <FiShield className="text-stone-900 shrink-0" size={14} />
                                <span>100% Authentic</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: SCROLLABLE DETAILS & ACTIONS */}
                    <div className="w-full md:w-1/2 flex flex-col flex-1 md:overflow-y-auto p-5 sm:p-7 md:p-8 custom-scrollbar">

                        {/* Navigation Tabs */}
                        <div className="flex gap-6 border-b border-stone-200 mb-4 shrink-0">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`pb-2.5 text-xs font-bold tracking-widest uppercase transition-colors relative ${
                                    activeTab === 'details' ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
                                }`}
                            >
                                Overview
                                {activeTab === 'details' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-stone-900"></span>}
                            </button>
                            <button
                                onClick={() => setActiveTab('reviews')}
                                className={`pb-2.5 text-xs font-bold tracking-widest uppercase transition-colors relative flex items-center gap-1.5 ${
                                    activeTab === 'reviews' ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
                                }`}
                            >
                                Reviews <span className="bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded text-[10px] font-bold">{product.reviews?.length || 0}</span>
                                {activeTab === 'reviews' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-stone-900"></span>}
                            </button>
                        </div>

                        {activeTab === 'details' ? (
                            <div className="space-y-4 animate-fade-in flex-1">
                                {/* Title & Category */}
                                <div>
                                    <span className="text-[10px] font-extrabold tracking-widest uppercase text-stone-400 block mb-1">
                                        {product.category || 'Atelier Collection'}
                                    </span>
                                    <h2 className="text-xl sm:text-2xl font-light text-stone-900 tracking-tight leading-snug">
                                        {product.name}
                                    </h2>
                                </div>

                                {/* Price & Rating */}
                                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/60 flex items-center justify-between gap-3">
                                    <div className="flex items-baseline gap-2.5">
                                        <span className="text-2xl font-extrabold text-stone-900">
                                            {convertPrice(currentPrice)}
                                        </span>
                                        {originalPrice > currentPrice && (
                                            <span className="text-xs text-stone-400 line-through">
                                                {convertPrice(originalPrice)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center text-xs text-stone-600 bg-white px-2.5 py-1 rounded-full border border-stone-200/60 shadow-sm">
                                        <FiStar className="text-yellow-400 fill-current mr-1" size={13} />
                                        <span className="font-bold text-stone-900 mr-1">{product.rating || 5.0}</span>
                                        <span className="text-stone-400">({product.reviews?.length || 18})</span>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                                    {product.description || "Crafted with high-density premium materials and designed for everyday luxury and timeless elegance."}
                                </p>

                                {/* Color Swatches */}
                                {product.colors && product.colors.length > 0 && (
                                    <div>
                                        <span className="text-[11px] font-bold tracking-wider uppercase text-stone-900 block mb-2">
                                            Color: <span className="text-stone-500 font-normal capitalize">{resolveColorLabel(selectedColor)}</span>
                                        </span>
                                        <div className="flex flex-wrap gap-2.5">
                                            {product.colors.map((color, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedColor(color);
                                                        if (safeImages[idx]) setActiveImageIdx(idx);
                                                    }}
                                                    className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                                                        selectedColor === color ? 'border-stone-900 scale-110 ring-2 ring-stone-900/20 shadow-sm' : 'border-stone-200 hover:border-stone-400'
                                                    }`}
                                                    title={resolveColorLabel(color)}
                                                >
                                                    <span
                                                        className="w-6 h-6 rounded-full block border border-stone-200/60"
                                                        style={{ backgroundColor: resolveSwatchColor(color) }}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Size Options */}
                                {product.sizes && product.sizes.length > 0 && (
                                    <div>
                                        <span className="text-[11px] font-bold tracking-wider uppercase text-stone-900 block mb-2">
                                            Size: <span className="text-stone-500 font-normal">{selectedSize || 'Choose size'}</span>
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {product.sizes.map((size) => (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold tracking-wider uppercase transition-all ${
                                                        selectedSize === size
                                                            ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                                                            : 'border-stone-200 text-stone-700 bg-stone-50/80 hover:border-stone-400 hover:bg-white'
                                                    }`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons Area */}
                                <div className="pt-3 border-t border-stone-200 space-y-3 pb-4">
                                    <div className="flex items-center gap-2.5">
                                        {/* Quantity */}
                                        <div className="flex items-center border border-stone-200 rounded-full bg-stone-50 px-1.5 py-0.5 h-11 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                                                className="w-7 h-7 flex items-center justify-center text-stone-600 hover:text-stone-900 rounded-full"
                                                disabled={isOutOfStock}
                                            >
                                                <FiMinus size={13} />
                                            </button>
                                            <span className="w-7 text-center text-xs font-bold text-stone-900">{quantity}</span>
                                            <button
                                                type="button"
                                                onClick={() => setQuantity((prev) => prev + 1)}
                                                className="w-7 h-7 flex items-center justify-center text-stone-600 hover:text-stone-900 rounded-full"
                                                disabled={isOutOfStock}
                                            >
                                                <FiPlus size={13} />
                                            </button>
                                        </div>

                                        {/* Add to Bag */}
                                        <button
                                            type="button"
                                            onClick={handleAdd}
                                            disabled={isOutOfStock || isAdding}
                                            className="flex-1 h-11 bg-white border-2 border-stone-900 text-stone-900 rounded-full text-xs font-extrabold tracking-wider uppercase hover:bg-stone-900 hover:text-white transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                                        >
                                            <FiShoppingBag size={14} />
                                            {isAdding ? 'Adding...' : isOutOfStock ? 'Sold Out' : 'Add to Bag'}
                                        </button>

                                        {/* Buy Now */}
                                        <button
                                            type="button"
                                            onClick={handleBuyNow}
                                            disabled={isOutOfStock}
                                            className="flex-1 h-11 bg-stone-900 hover:bg-black text-white rounded-full text-xs font-extrabold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                                        >
                                            <FiZap size={13} className="text-amber-400" />
                                            Buy Now
                                        </button>
                                    </div>

                                    {/* Full Product Detail Link */}
                                    <Link
                                        href={`/product/${product.id}`}
                                        onClick={() => {
                                            window.scrollTo({ top: 0, behavior: 'instant' });
                                            onClose();
                                        }}
                                        className="w-full text-center text-[11px] font-bold tracking-widest uppercase text-stone-600 hover:text-stone-900 flex items-center justify-center gap-1.5 py-2.5 transition-colors bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200"
                                    >
                                        View Full Product Page <FiArrowRight size={13} />
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            /* Reviews Tab */
                            <div className="space-y-3 animate-fade-in flex-1">
                                {product.reviews && product.reviews.length > 0 ? (
                                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                                        {product.reviews.map((rev, i) => (
                                            <div key={i} className="border-b border-stone-100 pb-3">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-bold text-xs text-stone-900">{rev.user || 'Verified Buyer'}</span>
                                                    <div className="flex text-yellow-400 text-xs">
                                                        {[...Array(5)].map((_, idx) => (
                                                            <FiStar key={idx} size={11} className={idx < (rev.rating || 5) ? 'fill-current' : 'text-stone-200'} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-stone-600 leading-relaxed">{rev.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-stone-400 text-xs bg-stone-50 rounded-xl border border-stone-200/50">
                                        No reviews yet for this piece.
                                    </div>
                                )}

                                <Link
                                    href={`/product/${product.id}`}
                                    onClick={() => {
                                        window.scrollTo({ top: 0, behavior: 'instant' });
                                        onClose();
                                    }}
                                    className="inline-flex items-center gap-1 text-xs font-bold tracking-wider uppercase text-stone-900 hover:underline pt-2"
                                >
                                    Read All Reviews on Full Product Page &rarr;
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
