'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
    FiShoppingBag, FiHeart, FiStar, FiTruck, FiMinus, FiPlus,
    FiChevronRight, FiChevronLeft, FiRefreshCcw, FiX, FiMessageSquare, FiShare2,
    FiChevronDown, FiChevronUp, FiCheckCircle, FiCamera, FiShield, FiZap,
    FiEye, FiMaximize2, FiClock, FiCheck
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// Global Contexts & Supabase
import { useCart } from '../../context/CartContext';
import { useGlobalCurrency } from '../../context/CurrencyContext';
import { useWishlist } from '../../context/WishlistContext';
import { supabase } from '../../utils/supabase';

// Magnetic Button Import
import MagneticButton from '../../components/MagneticButton';
import { resolveSwatchColor, resolveColorLabel } from '../../utils/colorUtils';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function ProductDetailClient({ initialProduct, initialRelated }) {
    const params = useParams();
    const router = useRouter();
    const productId = params?.id;

    const { addToCart, closeCart, isCartOpen } = useCart() || {};
    const { convertPrice, freeShippingThreshold } = useGlobalCurrency() || { convertPrice: (v) => `₹${Number(v).toFixed(2)}`, freeShippingThreshold: 0 };
    const { wishlistItems, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist() || { isInWishlist: () => false };

    // Component States — seeded from SSR props
    const [isMounted, setIsMounted] = useState(false);
    const [product, setProduct] = useState(initialProduct || null);
    const [relatedProducts, setRelatedProducts] = useState(initialRelated || []);
    const [quantity, setQuantity] = useState(1);
    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const [selectedColor, setSelectedColor] = useState(() => initialProduct?.colors?.[0] || '');
    const [selectedSize, setSelectedSize] = useState(() => initialProduct?.sizes?.[0] || '');

    // UI States
    const [activeTab, setActiveTab] = useState('details');
    const [openAccordion, setOpenAccordion] = useState('details');
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [reviewImages, setReviewImages] = useState([]);

    // Full-screen Image Lightbox
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Live Viewers Social Proof Simulation
    const [viewersCount, setViewersCount] = useState(17);

    // Size Guide States
    const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
    const [sizeGuideTab, setSizeGuideTab] = useState('chart');

    // Real Pincode States
    const [pincode, setPincode] = useState('');
    const [pinLoading, setPinLoading] = useState(false);
    const [pinMessage, setPinMessage] = useState(null);

    const imageScrollRef = useRef(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Instant scroll to top whenever a (new) product page is landed on
    useIsomorphicLayoutEffect(() => {
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
    }, [productId]);

    // Live viewers fluctuation effect
    useEffect(() => {
        const interval = setInterval(() => {
            setViewersCount(prev => {
                const delta = Math.floor(Math.random() * 5) - 2;
                return Math.max(9, Math.min(38, prev + delta));
            });
        }, 9000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!initialProduct) {
            toast.error("Piece not found in catalog.");
            router.push('/shop');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleScroll = (e) => {
        const scrollLeft = e.target.scrollLeft;
        const width = e.target.clientWidth;
        const newIndex = Math.round(scrollLeft / width);
        if (newIndex !== activeImageIdx) setActiveImageIdx(newIndex);
    };

    const maxStock = product?.stock && product.stock > 0 ? product.stock : 15;
    const increaseQuantity = () => setQuantity(prev => (prev < maxStock ? prev + 1 : prev));
    const decreaseQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

    const handleAddToCart = () => {
        if (!product) return;
        if (product.sizes?.length > 0 && !selectedSize) {
            return toast.error("Please select a size first.");
        }
        addToCart({ ...product, color: selectedColor, size: selectedSize }, quantity);
        toast.success(
            <div className="flex flex-col">
                <span className="font-bold">{product.name}</span>
                <span className="text-sm">Added to your bag ({quantity}x)</span>
            </div>,
            { icon: '🛍️' }
        );
    };

    const handleBuyNow = () => {
        if (!product) return;
        if (product.sizes?.length > 0 && !selectedSize) {
            return toast.error("Please select a size first.");
        }
        addToCart({ ...product, color: selectedColor, size: selectedSize }, quantity);
        if (closeCart) closeCart();
        toast.success("Proceeding to luxury checkout...", { icon: '⚡' });
        router.push('/checkout');
    };

    const isWishlisted = product ? isInWishlist(product.id) : false;

    const handleWishlistToggle = () => {
        if (!product) return;
        if (isWishlisted) {
            removeFromWishlist(product.id);
            toast.success(`${product.name} removed from wishlist!`, { icon: '💔' });
        } else {
            addToWishlist(product);
            toast.success(`${product.name} saved to wishlist!`, { icon: '❤️', style: { background: '#fef2f2', color: '#991b1b' } });
        }
    };

    const handleShare = async () => {
        if (!product) return;
        const shareData = {
            title: `${product.name} | ShopHub Luxury`,
            text: `Discover ${product.name} on ShopHub.`,
            url: window.location.href
        };
        if (navigator.share) {
            try { await navigator.share(shareData); } catch (err) { }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied to clipboard!', { icon: '🔗' });
        }
    };

    // REAL PINCODE API CHECKER
    const handleCheckPincode = async () => {
        if (pincode.length !== 6) return;

        setPinLoading(true);
        setPinMessage(null);

        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            const data = await response.json();

            if (data && data[0] && data[0].Status === 'Success') {
                const postOffice = data[0].PostOffice[0];
                const location = `${postOffice.District}, ${postOffice.State}`;

                const deliveryDate = new Date();
                deliveryDate.setDate(deliveryDate.getDate() + 3);
                const dateString = deliveryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

                setPinMessage({ type: 'success', text: `✅ Delivery available to ${location}. Estimated arrival by ${dateString}.` });
            } else {
                setPinMessage({ type: 'error', text: '❌ Invalid Pincode. Please verify and try again.' });
            }
        } catch (error) {
            setPinMessage({ type: 'error', text: '❌ Unable to verify pincode at the moment.' });
        } finally {
            setPinLoading(false);
        }
    };

    // Image Upload Handler for Reviews
    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (reviewImages.length + files.length > 3) {
            return toast.error("You can upload a maximum of 3 photos.");
        }

        Promise.all(files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        })).then(images => setReviewImages(prev => [...prev, ...images]));
    };

    const submitReview = async (e) => {
        e.preventDefault();
        if (reviewRating === 0) return toast.error("Please select a star rating first.");
        if (reviewText.trim().length < 5) return toast.error("Review must be at least 5 characters.");

        let reviewerName = 'Verified Collector';
        try {
            const localUser = JSON.parse(localStorage.getItem('currentUser'));
            if (localUser && localUser.firstName) reviewerName = `${localUser.firstName} ${localUser.lastName || ''}`.trim();
        } catch (err) { console.warn("Could not fetch user name"); }

        const newReview = {
            user: reviewerName,
            rating: reviewRating,
            text: reviewText,
            images: reviewImages,
            date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        };

        const existingReviews = product.reviews || [];
        const updatedReviews = [newReview, ...existingReviews];
        const totalRating = updatedReviews.reduce((sum, rev) => sum + rev.rating, 0);
        const newAverageRating = parseFloat((totalRating / updatedReviews.length).toFixed(1));

        const updatedProduct = { ...product, reviews: updatedReviews, rating: newAverageRating };
        setProduct(updatedProduct);
        setReviewRating(0);
        setReviewText('');
        setReviewImages([]);

        try {
            const { error } = await supabase.from('products').update({ reviews: updatedReviews, rating: newAverageRating }).eq('id', product.id);
            if (error) toast.error("Failed to sync review with server.");
            else toast.success("Thank you! Your verified review is now live.", { icon: '✨' });
        } catch (error) { toast.error("Network error while saving review."); }
    };

    const isClothingCategory = product ? ['clothing', 'apparel', 't-shirt', 'shirt', 'dress', 'jeans', 'bottoms', 'tops', 'outerwear', 'hoodie'].some(cat => product.category?.toLowerCase().includes(cat)) : false;

    const displayReviewsForMarquee = product?.reviews?.length > 0 ? product.reviews : [
        { user: "Vikramaditya S.", text: "Exquisite tailoring and silhouette. Truly lives up to the atelier luxury standard.", rating: 5 },
        { user: "Ananya R.", text: "The fabric feel is unmatched. Delivered impeccably packaged in signature luxury box.", rating: 5 },
        { user: "Devansh K.", text: "Flawless drape and detailing. Exceeded all expectations.", rating: 5 },
        { user: "Mira T.", text: "An investment piece that turns heads every time I wear it.", rating: 5 }
    ];

    if (!product) {
        return (
            <div className="min-h-[70vh] w-full bg-white flex flex-col items-center justify-center animate-fade-in">
                <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-2 border-stone-100 border-t-stone-900 rounded-full animate-spin mb-8 shadow-sm"></div>
                    <h2 className="text-2xl font-extrabold text-stone-900 tracking-tighter flex items-baseline mb-2">
                        ShopHub<span className="text-stone-400 text-3xl leading-none">.</span>
                    </h2>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 animate-pulse">
                        Curating Experience...
                    </p>
                </div>
            </div>
        );
    }

    // Pricing & discount calculations
    const currentPrice = Number(product.salePrice || product.price || 0);
    const originalPrice = Number(product.oldPrice || (product.salePrice && product.price > product.salePrice ? product.price : 0));
    const hasDiscount = originalPrice > currentPrice;
    const savingsAmount = hasDiscount ? originalPrice - currentPrice : 0;
    const discountPercent = hasDiscount ? Math.round((savingsAmount / originalPrice) * 100) : 0;

    // Stock urgency calculation
    const isLowStock = product.stock !== undefined && product.stock !== null && product.stock > 0 && product.stock <= 7;
    const isOutOfStock = product.stock !== undefined && product.stock === 0;

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 25s linear infinite;
                    display: flex;
                    width: max-content;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}} />

            <main className="bg-stone-50 min-h-screen pb-36 pt-24 animate-fade-in relative">
                <div className="max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-12">

                    {/* Breadcrumb Navigation */}
                    <nav className="flex items-center text-xs tracking-widest uppercase font-bold text-stone-400 mb-6 border-b border-stone-200/50 pb-4 overflow-x-auto hide-scrollbar whitespace-nowrap">
                        <Link href="/" className="hover:text-stone-900 transition-colors">Home</Link>
                        <FiChevronRight className="mx-2 text-stone-300 flex-shrink-0" />
                        <Link href="/shop" className="hover:text-stone-900 transition-colors">Shop</Link>
                        <FiChevronRight className="mx-2 text-stone-300 flex-shrink-0" />
                        <Link href={`/categories`} className="hover:text-stone-900 transition-colors truncate max-w-[120px] sm:max-w-none">
                            {product.category || 'Collections'}
                        </Link>
                        <FiChevronRight className="mx-2 text-stone-300 flex-shrink-0" />
                        <span className="text-stone-900 truncate max-w-[160px] sm:max-w-none">{product.name}</span>
                    </nav>

                    {/* Main Product Showcase Card */}
                    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-xl shadow-stone-200/40 w-full border border-stone-100 flex flex-col lg:flex-row overflow-hidden">

                        {/* LEFT COLUMN: IMAGE GALLERY */}
                        <div className="w-full lg:w-1/2 p-4 sm:p-8 lg:p-10 bg-stone-50/40 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-stone-100 relative">
                            
                            {/* Desktop Gallery */}
                            <div className="hidden md:flex flex-col gap-3 w-full relative">
                                <div className="relative w-full aspect-square md:aspect-[4/5] max-h-[440px] bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200/70 group cursor-zoom-in">
                                    <Image
                                        src={product.images[activeImageIdx]}
                                        alt={product.name}
                                        fill
                                        sizes="(max-width: 1024px) 100vw, 50vw"
                                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                        priority
                                        onClick={() => setIsLightboxOpen(true)}
                                    />

                                    {/* Badges on Main Image */}
                                    <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                                        {discountPercent > 0 && (
                                            <span className="bg-stone-900/90 backdrop-blur-md text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                                                -{discountPercent}% OFF
                                            </span>
                                        )}
                                        {product.isFeatured && (
                                            <span className="bg-amber-600/90 backdrop-blur-md text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                                                Featured
                                            </span>
                                        )}
                                    </div>

                                    {/* Action Buttons Top-Right */}
                                    <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                                        <button
                                            onClick={() => setIsLightboxOpen(true)}
                                            className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm text-stone-900 hover:bg-stone-900 hover:text-white transition-all transform hover:scale-105"
                                            title="Expand Gallery"
                                        >
                                            <FiMaximize2 size={16} />
                                        </button>
                                        <button
                                            onClick={handleShare}
                                            className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm text-stone-900 hover:bg-stone-900 hover:text-white transition-all transform hover:scale-105"
                                            title="Share Piece"
                                        >
                                            <FiShare2 size={16} />
                                        </button>
                                    </div>

                                    {/* Bottom Image Count Pill */}
                                    <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full pointer-events-none">
                                        {activeImageIdx + 1} / {product.images.length}
                                    </div>
                                </div>

                                {/* Thumbnail Strip (Clearly visible directly under main image) */}
                                {product.images.length > 1 && (
                                    <div className="flex gap-2.5 overflow-x-auto hide-scrollbar py-1">
                                        {product.images.map((img, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setActiveImageIdx(idx);
                                                }}
                                                className={`relative w-16 h-20 sm:w-18 sm:h-22 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                                                    activeImageIdx === idx
                                                        ? 'border-stone-900 shadow-md ring-2 ring-stone-900/10 scale-95'
                                                        : 'border-transparent opacity-60 hover:opacity-100'
                                                }`}
                                            >
                                                <Image src={img} alt={`thumbnail-${idx}`} fill sizes="80px" className="object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Mobile Swipe Gallery */}
                            <div className="flex md:hidden relative w-full aspect-[4/5] bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200/60 group">
                                <div
                                    ref={imageScrollRef}
                                    onScroll={handleScroll}
                                    className="flex w-full h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar scroll-smooth"
                                >
                                    {product.images.map((img, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setIsLightboxOpen(true)}
                                            className="min-w-full h-full snap-center relative flex-shrink-0 cursor-zoom-in"
                                        >
                                            <Image
                                                src={img}
                                                alt={`${product.name} - ${idx + 1}`}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 800px"
                                                className="object-cover"
                                                priority={idx === 0}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Top Badges */}
                                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                                    {discountPercent > 0 && (
                                        <span className="bg-stone-900/90 backdrop-blur text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                            -{discountPercent}% OFF
                                        </span>
                                    )}
                                </div>

                                {/* Top Right Actions */}
                                <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                                    <button
                                        onClick={() => setIsLightboxOpen(true)}
                                        className="w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm text-stone-900"
                                    >
                                        <FiMaximize2 size={16} />
                                    </button>
                                    <button
                                        onClick={handleShare}
                                        className="w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm text-stone-900"
                                    >
                                        <FiShare2 size={16} />
                                    </button>
                                </div>

                                {/* Mobile Pagination Indicator */}
                                {product.images.length > 1 && (
                                    <div className="absolute bottom-3 left-0 w-full flex justify-center gap-1.5 z-10 pointer-events-none">
                                        {product.images.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                                    activeImageIdx === idx ? 'w-6 bg-stone-900' : 'w-1.5 bg-white/80'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Mobile Thumbnail Selector Strip */}
                            {product.images.length > 1 && (
                                <div className="flex md:hidden gap-2.5 overflow-x-auto hide-scrollbar pt-1 pb-1">
                                    {product.images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setActiveImageIdx(idx);
                                                if (imageScrollRef.current) {
                                                    const width = imageScrollRef.current.clientWidth;
                                                    imageScrollRef.current.scrollTo({ left: width * idx, behavior: 'smooth' });
                                                }
                                            }}
                                            className={`relative w-16 h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${
                                                activeImageIdx === idx ? 'border-stone-900 shadow-md ring-2 ring-stone-900/20 scale-95' : 'border-stone-200 opacity-60 hover:opacity-100'
                                            }`}
                                        >
                                            <Image src={img} alt={`mobile-thumb-${idx}`} fill sizes="70px" className="object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: DETAILS & ACTIONS */}
                        <div className="w-full lg:w-1/2 p-5 sm:p-7 lg:p-8 flex flex-col justify-between">
                            <div>
                                {/* Category & Live Viewers Banner */}
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                                    <span className="text-stone-500 font-extrabold tracking-widest uppercase text-[11px]">
                                        {product.category || 'Atelier Collection'}
                                    </span>
                                    <div className="flex items-center gap-1.5 bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-rose-100 animate-pulse">
                                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                        <FiEye size={12} />
                                        <span>{viewersCount} people viewing right now</span>
                                    </div>
                                </div>

                                {/* Product Title */}
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-light text-stone-900 mb-3 leading-tight tracking-tight">
                                    {product.name}
                                </h1>

                                {/* Pricing Section with Savings Breakdown */}
                                <div className="bg-stone-50/70 p-3 sm:p-4 rounded-xl border border-stone-200/60 mb-3.5">
                                    <div className="flex flex-wrap items-baseline gap-2.5 mb-1.5">
                                        <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                                            {convertPrice(currentPrice)}
                                        </span>
                                        {hasDiscount && (
                                            <>
                                                <span className="text-base text-stone-400 line-through">
                                                    {convertPrice(originalPrice)}
                                                </span>
                                                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                    Save {discountPercent}%
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {hasDiscount && (
                                        <p className="text-xs font-semibold text-emerald-700 mb-1.5">
                                            You save {convertPrice(savingsAmount)} on this piece
                                        </p>
                                    )}

                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-stone-200/50 text-xs text-stone-500">
                                        <span className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                                            <FiCheck className="text-emerald-600" size={13} /> Inclusive of all luxury taxes & duties
                                        </span>
                                        <div
                                            className="flex items-center gap-1 text-stone-700 font-semibold cursor-pointer hover:underline text-[11px] sm:text-xs"
                                            onClick={() => setActiveTab('reviews')}
                                        >
                                            <FiStar className="text-yellow-400 fill-current" size={13} />
                                            <span>{product.rating || 5.0}</span>
                                            <span className="text-stone-400 font-normal">({product.reviews?.length || 18} reviews)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stock Urgency Alert */}
                                {isLowStock ? (
                                    <div className="mb-3.5 bg-amber-50 border border-amber-200/70 rounded-xl p-2.5 sm:p-3 flex items-center gap-2.5 text-amber-900">
                                        <FiZap className="text-amber-600 flex-shrink-0 animate-bounce" size={18} />
                                        <div className="flex-1 text-xs">
                                            <p className="font-bold">⚡ In High Demand — Only {product.stock} pieces remaining!</p>
                                            <p className="text-amber-700/90 mt-0.5">Order now to avoid missing out on this release.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-3.5 flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50/60 border border-emerald-100 px-3 py-1.5 rounded-xl">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        <span>Ready to Dispatch • Ships within 24–48 hours</span>
                                    </div>
                                )}

                                {/* COLOR SELECTION */}
                                {product.colors && product.colors.length > 0 && (
                                    <div className="mb-3.5">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold tracking-widest uppercase text-stone-900">
                                                Color: <span className="font-semibold text-stone-600 capitalize">{resolveColorLabel(selectedColor) || 'Default'}</span>
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2.5">
                                            {product.colors.map((color, idx) => (
                                                <button
                                                    key={color}
                                                    onClick={() => {
                                                        setSelectedColor(color);
                                                        if (product.images[idx]) {
                                                            setActiveImageIdx(idx);
                                                            if (imageScrollRef.current) {
                                                                const width = imageScrollRef.current.clientWidth;
                                                                imageScrollRef.current.scrollTo({ left: width * idx, behavior: 'smooth' });
                                                            }
                                                        }
                                                    }}
                                                    className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center relative ${
                                                        selectedColor === color
                                                            ? 'border-stone-900 ring-2 ring-stone-900 ring-offset-2 scale-105 shadow-sm'
                                                            : 'border-stone-200 hover:border-stone-400'
                                                    }`}
                                                    title={resolveColorLabel(color)}
                                                >
                                                    <span
                                                        className="w-6 h-6 rounded-full block border border-stone-200/40"
                                                        style={{ backgroundColor: resolveSwatchColor(color) }}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* SIZE SELECTION */}
                                {product.sizes && product.sizes.length > 0 && (
                                    <div className="mb-3.5">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold tracking-widest uppercase text-stone-900">
                                                Size: <span className="font-semibold text-stone-600">{selectedSize || 'Select Your Size'}</span>
                                            </span>
                                            {isClothingCategory && (
                                                <button
                                                    onClick={() => setIsSizeGuideOpen(true)}
                                                    className="text-xs text-stone-900 font-bold uppercase tracking-wider underline hover:text-stone-600 transition-colors flex items-center gap-1"
                                                >
                                                    Size Guide
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {product.sizes.map(size => (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`px-4 py-2 min-w-[2.8rem] rounded-xl border text-xs font-bold tracking-wider uppercase transition-all ${
                                                        selectedSize === size
                                                            ? 'border-stone-900 bg-stone-900 text-white shadow-md scale-105'
                                                            : 'border-stone-200 text-stone-700 bg-white hover:border-stone-400 hover:bg-stone-50'
                                                    }`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* DESKTOP ACTION BAR: QUANTITY + ADD TO BAG + BUY NOW + WISHLIST */}
                                <div className="hidden md:flex flex-col gap-2.5 pt-3 border-t border-stone-100">
                                    <div className="flex items-center gap-2.5">
                                        {/* Quantity Stepper */}
                                        <div className="flex items-center justify-between w-[110px] h-[48px] bg-stone-50 border border-stone-200 rounded-full px-2 shadow-inner">
                                            <button
                                                onClick={decreaseQuantity}
                                                className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-white rounded-full transition-colors"
                                                aria-label="Decrease quantity"
                                            >
                                                <FiMinus size={15} />
                                            </button>
                                            <span className="font-bold text-sm text-stone-900 select-none">{quantity}</span>
                                            <button
                                                onClick={increaseQuantity}
                                                className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-white rounded-full transition-colors"
                                                aria-label="Increase quantity"
                                            >
                                                <FiPlus size={15} />
                                            </button>
                                        </div>

                                        {/* Add to Bag Button */}
                                        <button
                                            onClick={handleAddToCart}
                                            disabled={isOutOfStock}
                                            className="flex-1 h-[48px] bg-white border-2 border-stone-900 text-stone-900 rounded-full text-xs font-extrabold tracking-widest uppercase hover:bg-stone-900 hover:text-white transition-all duration-300 shadow-sm flex items-center justify-center gap-2"
                                        >
                                            <FiShoppingBag size={16} /> ADD TO BAG
                                        </button>

                                        {/* Buy Now Button (Instant Checkout) */}
                                        <button
                                            onClick={handleBuyNow}
                                            disabled={isOutOfStock}
                                            className="flex-1 h-[48px] bg-stone-900 text-white rounded-full text-xs font-extrabold tracking-widest uppercase hover:bg-black transition-all duration-300 shadow-md shadow-stone-900/20 flex items-center justify-center gap-2 group"
                                        >
                                            <FiZap size={15} className="text-amber-400 group-hover:scale-110 transition-transform" /> BUY NOW
                                        </button>

                                        {/* Wishlist Heart Button */}
                                        <button
                                            onClick={handleWishlistToggle}
                                            className={`w-[48px] h-[48px] flex-shrink-0 border rounded-full flex items-center justify-center transition-all ${
                                                isWishlisted
                                                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                                                    : 'bg-white border-stone-200 text-stone-400 hover:text-stone-900 hover:bg-stone-50 shadow-sm'
                                            }`}
                                            aria-label="Save to Wishlist"
                                        >
                                            <FiHeart size={18} className={isWishlisted ? 'fill-current text-rose-500' : ''} />
                                        </button>
                                    </div>
                                </div>

                                {/* PINCODE DELIVERY CHECKER */}
                                <div className="mt-4 border-t border-stone-100 pt-3.5">
                                    <h3 className="text-xs font-bold tracking-widest uppercase text-stone-900 mb-2 flex items-center gap-2">
                                        <FiTruck size={15} /> Check Delivery Availability
                                    </h3>
                                    <div className={`flex items-center border ${pinMessage?.type === 'error' ? 'border-rose-400' : pinMessage?.type === 'success' ? 'border-emerald-500' : 'border-stone-300'} rounded-xl overflow-hidden h-10 mb-1.5 transition-colors bg-white shadow-sm`}>
                                        <input
                                            type="text"
                                            placeholder="Enter 6-digit Pincode"
                                            value={pincode}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                setPincode(val);
                                                if (pinMessage) setPinMessage(null);
                                            }}
                                            className="flex-1 px-3.5 text-xs font-medium text-stone-900 focus:outline-none placeholder-stone-400"
                                            maxLength={6}
                                        />
                                        <button
                                            onClick={handleCheckPincode}
                                            disabled={pinLoading || pincode.length < 6}
                                            className="px-4 font-bold text-stone-900 text-xs tracking-widest h-full bg-stone-100 hover:bg-stone-200 disabled:opacity-50 transition-colors uppercase border-l border-stone-200"
                                        >
                                            {pinLoading ? '...' : 'Verify'}
                                        </button>
                                    </div>

                                    {pinMessage && (
                                        <p className={`text-xs mb-2 font-semibold animate-fade-in ${pinMessage.type === 'success' ? 'text-emerald-700' : 'text-rose-600'}`}>
                                            {pinMessage.text}
                                        </p>
                                    )}
                                </div>

                                {/* LUXURY TRUST PILLARS (4 Cards Grid) */}
                                <div className="grid grid-cols-2 gap-2 mt-3.5">
                                    <div className="bg-stone-50/80 p-2.5 rounded-xl border border-stone-100 flex items-start gap-2">
                                        <FiShield className="text-stone-900 mt-0.5 flex-shrink-0" size={15} />
                                        <div>
                                            <p className="text-xs font-bold text-stone-900">100% Authentic</p>
                                            <p className="text-[10px] text-stone-500 leading-tight">Direct atelier certification</p>
                                        </div>
                                    </div>
                                    <div className="bg-stone-50/80 p-2.5 rounded-xl border border-stone-100 flex items-start gap-2">
                                        <FiTruck className="text-stone-900 mt-0.5 flex-shrink-0" size={15} />
                                        <div>
                                            <p className="text-xs font-bold text-stone-900">Express Delivery</p>
                                            <p className="text-[10px] text-stone-500 leading-tight">Insured luxury dispatch</p>
                                        </div>
                                    </div>
                                    <div className="bg-stone-50/80 p-2.5 rounded-xl border border-stone-100 flex items-start gap-2">
                                        <FiRefreshCcw className="text-stone-900 mt-0.5 flex-shrink-0" size={15} />
                                        <div>
                                            <p className="text-xs font-bold text-stone-900">30-Day Returns</p>
                                            <p className="text-[10px] text-stone-500 leading-tight">Doorstep pickup available</p>
                                        </div>
                                    </div>
                                    <div className="bg-stone-50/80 p-2.5 rounded-xl border border-stone-100 flex items-start gap-2">
                                        <FiCheckCircle className="text-stone-900 mt-0.5 flex-shrink-0" size={15} />
                                        <div>
                                            <p className="text-xs font-bold text-stone-900">Z+ Secure Pay</p>
                                            <p className="text-[10px] text-stone-500 leading-tight">256-bit encrypted checkout</p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* EDITORIAL ACCORDIONS & PRODUCT SPECIFICATIONS (FULL WIDTH) */}
                    <div className="mt-8 bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 border border-stone-100 shadow-xl shadow-stone-200/40">
                        <div className="border-b border-stone-200 pb-4 mb-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                            <div>
                                <span className="text-[10px] font-extrabold tracking-widest uppercase text-stone-400 block mb-1">
                                    Atelier Craftsmanship & Standards
                                </span>
                                <h2 className="text-xl sm:text-2xl font-light text-stone-900">
                                    Product Details & Specifications
                                </h2>
                            </div>
                            <p className="text-xs text-stone-400 font-medium">Inspected & Verified by ShopHub Atelier</p>
                        </div>
                        <div className="divide-y divide-stone-200">
                            {/* Accordion 1: Details */}
                            <div className="py-1">
                                <button
                                    type="button"
                                    onClick={() => setOpenAccordion(openAccordion === 'details' ? null : 'details')}
                                    className="w-full py-4 flex justify-between items-center text-left hover:text-stone-600 transition-colors"
                                >
                                    <span className="font-bold text-stone-900 text-sm">Product Details & Specifications</span>
                                    {openAccordion === 'details' ? <FiChevronUp size={18} className="text-stone-500" /> : <FiChevronDown size={18} className="text-stone-500" />}
                                </button>
                                {openAccordion === 'details' && (
                                    <div className="pb-5 text-xs text-stone-600 space-y-2 animate-fade-in leading-relaxed">
                                        <p><strong>Category:</strong> <span className="capitalize">{product.category || 'Atelier Apparel'}</span></p>
                                        {product.sku && <p><strong>SKU Identifier:</strong> {product.sku}</p>}
                                        {product.colors?.length > 0 && <p><strong>Available Hues:</strong> {product.colors.map(c => resolveColorLabel(c)).join(', ')}</p>}
                                        {product.sizes?.length > 0 && <p><strong>Standard Sizes:</strong> {product.sizes.join(', ')}</p>}
                                        <p><strong>Craftsmanship:</strong> Premium structured construction designed for long-term durability.</p>
                                    </div>
                                )}
                            </div>

                            {/* Accordion 2: Description */}
                            <div className="py-1">
                                <button
                                    type="button"
                                    onClick={() => setOpenAccordion(openAccordion === 'description' ? null : 'description')}
                                    className="w-full py-4 flex justify-between items-center text-left hover:text-stone-600 transition-colors"
                                >
                                    <span className="font-bold text-stone-900 text-sm">Story & Description</span>
                                    {openAccordion === 'description' ? <FiChevronUp size={18} className="text-stone-500" /> : <FiChevronDown size={18} className="text-stone-500" />}
                                </button>
                                {openAccordion === 'description' && (
                                    <div className="pb-5 text-xs text-stone-600 leading-relaxed animate-fade-in whitespace-pre-wrap">
                                        {product.description || "Masterfully tailored with high-density premium materials. Each piece is rigorously inspected to ensure uncompromising quality, drape, and comfort."}
                                    </div>
                                )}
                            </div>

                            {/* Accordion 3: Fabric & Care */}
                            <div className="py-1">
                                <button
                                    type="button"
                                    onClick={() => setOpenAccordion(openAccordion === 'care' ? null : 'care')}
                                    className="w-full py-4 flex justify-between items-center text-left hover:text-stone-600 transition-colors"
                                >
                                    <span className="font-bold text-stone-900 text-sm">Fabric & Care Guide</span>
                                    {openAccordion === 'care' ? <FiChevronUp size={18} className="text-stone-500" /> : <FiChevronDown size={18} className="text-stone-500" />}
                                </button>
                                {openAccordion === 'care' && (
                                    <div className="pb-5 text-xs text-stone-600 space-y-2 animate-fade-in leading-relaxed">
                                        <p>• Hand wash or gentle cycle cold with like colors.</p>
                                        <p>• Do not tumble dry. Reshape and lay flat to dry in shade.</p>
                                        <p>• Cool iron on reverse if needed. Do not bleach.</p>
                                        <p>• Professional dry clean recommended for optimal longevity.</p>
                                    </div>
                                )}
                            </div>

                            {/* Accordion 4: Shipping & Returns */}
                            <div className="py-1">
                                <button
                                    type="button"
                                    onClick={() => setOpenAccordion(openAccordion === 'shipping' ? null : 'shipping')}
                                    className="w-full py-4 flex justify-between items-center text-left hover:text-stone-600 transition-colors"
                                >
                                    <span className="font-bold text-stone-900 text-sm">Shipping & Complimentary Returns</span>
                                    {openAccordion === 'shipping' ? <FiChevronUp size={18} className="text-stone-500" /> : <FiChevronDown size={18} className="text-stone-500" />}
                                </button>
                                {openAccordion === 'shipping' && (
                                    <div className="pb-5 text-xs text-stone-600 space-y-2 animate-fade-in leading-relaxed">
                                        <p>• <strong>Complimentary Express Shipping</strong> on all domestic prepaid orders.</p>
                                        <p>• Orders dispatched within 24 business hours from our central warehouse.</p>
                                        <p>• <strong>30-Day Hassle-Free Returns:</strong> We arrange direct doorstep pickup. Items must be unworn with original tags attached.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* REVIEWS & VERIFIED EXPERIENCES SECTION */}
                    <div className="mt-16 bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-12 border border-stone-100 shadow-xl shadow-stone-200/40">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-stone-200">
                            <div>
                                <h3 className="text-2xl sm:text-3xl font-light text-stone-900">
                                    Clientele <span className="font-serif italic font-bold">Reviews</span>
                                </h3>
                                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                                    Authentic feedback from verified collectors and buyers worldwide.
                                </p>
                            </div>
                            <div className="flex items-center gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200/60 w-fit">
                                <div className="text-3xl font-extrabold text-stone-900">{product.rating || 5.0}</div>
                                <div>
                                    <div className="flex text-yellow-400 text-sm">
                                        {[...Array(5)].map((_, idx) => (
                                            <FiStar key={idx} className="fill-current" />
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-stone-500 mt-0.5">Based on {product.reviews?.length || 18} verified ratings</p>
                                </div>
                            </div>
                        </div>

                        {/* Customer Reviews Marquee Banner */}
                        <div className="my-8 bg-stone-50/70 py-6 rounded-2xl overflow-hidden border border-stone-200/50">
                            <div className="animate-marquee flex gap-4 px-4 w-max">
                                {[...displayReviewsForMarquee, ...displayReviewsForMarquee].map((rev, idx) => (
                                    <div key={idx} className="bg-white rounded-2xl p-4 flex flex-col gap-2 shadow-sm border border-stone-100 min-w-[280px] max-w-[320px]">
                                        <div className="flex items-center justify-between">
                                            <div className="flex text-yellow-400 text-xs">
                                                {[...Array(5)].map((_, i) => (
                                                    <FiStar key={i} className={i < (rev.rating || 5) ? 'fill-current' : 'text-stone-200'} />
                                                ))}
                                            </div>
                                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">Verified</span>
                                        </div>
                                        <p className="text-xs font-bold text-stone-900 flex items-center gap-1.5 truncate">
                                            {rev.user} <FiCheckCircle className="text-stone-900" size={13} />
                                        </p>
                                        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">{rev.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Two Columns: Reviews List + Submission Form */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Left: Reviews List */}
                            <div className="space-y-6 max-h-[480px] overflow-y-auto pr-3 custom-scrollbar">
                                {product.reviews && product.reviews.length > 0 ? (
                                    product.reviews.map((rev, i) => (
                                        <div key={i} className="border-b border-stone-100 pb-6">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                                                        {rev.user} <FiCheckCircle className="text-stone-900" size={14} />
                                                    </span>
                                                    <span className="text-[11px] text-stone-400">{rev.date || 'Recent'}</span>
                                                </div>
                                                <div className="flex text-yellow-400 text-xs">
                                                    {[...Array(5)].map((_, idx) => (
                                                        <FiStar key={idx} className={idx < rev.rating ? 'fill-current' : 'text-stone-200'} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mt-2">{rev.text}</p>

                                            {rev.images && rev.images.length > 0 && (
                                                <div className="flex gap-2.5 mt-3 overflow-x-auto hide-scrollbar">
                                                    {rev.images.map((img, imgIdx) => (
                                                        <div key={imgIdx} className="w-16 h-16 rounded-xl overflow-hidden border border-stone-200 flex-shrink-0 shadow-sm">
                                                            <img src={img} alt="Customer photo" className="w-full h-full object-cover" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 bg-stone-50 rounded-2xl border border-stone-200/50">
                                        <FiMessageSquare className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                                        <p className="text-stone-700 font-bold text-sm">Be the first to share an experience</p>
                                        <p className="text-stone-400 text-xs mt-1">Submit your thoughts to help other patrons.</p>
                                    </div>
                                )}
                            </div>

                            {/* Right: Write Review Form */}
                            <div className="bg-stone-50 p-6 sm:p-8 rounded-3xl border border-stone-100 h-fit">
                                <h4 className="text-xs font-bold tracking-widest uppercase text-stone-900 mb-4">Write a Verified Review</h4>
                                <form onSubmit={submitReview}>
                                    <div className="flex items-center gap-1.5 mb-4">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                type="button"
                                                key={star}
                                                onClick={() => setReviewRating(star)}
                                                className="focus:outline-none transition-transform hover:scale-110"
                                            >
                                                <FiStar
                                                    size={22}
                                                    className={star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-300 hover:text-yellow-200 transition-colors'}
                                                />
                                            </button>
                                        ))}
                                        <span className="text-xs font-semibold text-stone-500 ml-2">
                                            {reviewRating > 0 ? `${reviewRating} Stars` : 'Tap to rate'}
                                        </span>
                                    </div>

                                    <textarea
                                        value={reviewText}
                                        onChange={(e) => setReviewText(e.target.value)}
                                        placeholder="Share details about the fit, material quality, and overall finish..."
                                        rows="4"
                                        className="w-full bg-white border border-stone-200 rounded-2xl p-4 text-xs sm:text-sm focus:outline-none focus:border-stone-900 mb-4 resize-none shadow-sm placeholder-stone-400"
                                    />

                                    {/* Upload Photos */}
                                    <div className="mb-5">
                                        <label className="inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-stone-600 mb-3 cursor-pointer hover:text-stone-900 transition-colors bg-white px-4 py-2 rounded-xl border border-stone-200 shadow-sm">
                                            <FiCamera size={16} /> Add Photos
                                            <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                                        </label>

                                        {reviewImages.length > 0 && (
                                            <div className="flex gap-2 mt-2 overflow-x-auto hide-scrollbar">
                                                {reviewImages.map((src, idx) => (
                                                    <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-stone-200 shadow-sm flex-shrink-0">
                                                        <img src={src} alt="Upload preview" className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => setReviewImages(prev => prev.filter((_, i) => i !== idx))}
                                                            className="absolute top-1 right-1 w-4 h-4 bg-black/60 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-rose-600"
                                                        >
                                                            <FiX />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-stone-900 text-white rounded-full py-3.5 text-xs font-bold tracking-widest uppercase hover:bg-black transition-colors shadow-md"
                                    >
                                        Publish Review
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* RELATED PIECES */}
                    {relatedProducts.length > 0 && (
                        <div className="mt-16 pt-10 border-t border-stone-200 w-full">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-light text-stone-900">
                                        You May Also <span className="font-serif italic font-bold">Admire</span>
                                    </h3>
                                    <p className="text-xs text-stone-500 mt-1">Curated pieces that complement this aesthetic.</p>
                                </div>
                                <Link href="/shop" className="text-xs font-bold tracking-widest uppercase text-stone-900 hover:underline flex items-center gap-1">
                                    View All <FiChevronRight />
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                                {relatedProducts.map((rp, index) => (
                                    <Link
                                        key={`${rp.id}-${index}`}
                                        href={`/product/${rp.id}`}
                                        onClick={() => {
                                            if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' });
                                        }}
                                        className="group flex flex-col"
                                    >
                                        <div className="w-full aspect-[4/5] bg-stone-100 rounded-2xl overflow-hidden mb-3 relative border border-stone-200/60 shadow-sm">
                                            <Image
                                                src={rp.images?.[0] || rp.image}
                                                alt={rp.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                                sizes="(max-width: 640px) 50vw, 25vw"
                                            />
                                            <div className="absolute top-2.5 left-2.5 bg-stone-900/80 backdrop-blur text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                                Atelier
                                            </div>
                                        </div>
                                        <p className="text-xs sm:text-sm font-bold text-stone-900 truncate group-hover:text-stone-600 transition-colors">{rp.name}</p>
                                        <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mt-0.5">{rp.category || 'Collection'}</p>
                                        <p className="text-xs sm:text-sm font-bold text-stone-900 mt-1">{convertPrice(rp.salePrice || rp.price)}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* MOBILE STICKY BOTTOM ACTION BAR (Ultra-Luxury Redesign) */}
            {isMounted && !isCartOpen && !isLightboxOpen && !isSizeGuideOpen && createPortal(
                <div
                    className="md:hidden fixed bottom-0 left-0 w-full z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/70 shadow-2xl px-4 pt-2.5 pb-[max(12px,env(safe-area-inset-bottom))]"
                    style={{
                        transform: 'translateZ(0)',
                        WebkitTransform: 'translateZ(0)'
                    }}
                >
                    <div className="flex items-center justify-between gap-2.5 max-w-md mx-auto">
                        {/* Wishlist Heart */}
                        <button
                            onClick={handleWishlistToggle}
                            className={`w-11 h-11 flex-shrink-0 border rounded-full flex items-center justify-center transition-all ${
                                isWishlisted
                                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                                    : 'bg-white border-stone-200 text-stone-400 shadow-sm'
                            }`}
                            aria-label="Wishlist"
                        >
                            <FiHeart size={18} className={isWishlisted ? 'fill-current text-rose-500' : ''} />
                        </button>

                        {/* Price & Selected Size display */}
                        <div className="flex flex-col justify-center min-w-0 pr-1">
                            <span className="text-xs text-stone-400 uppercase font-bold tracking-wider leading-none truncate">
                                {selectedSize ? `Size: ${selectedSize}` : 'Total'}
                            </span>
                            <span className="text-base font-extrabold text-stone-900 leading-tight">
                                {convertPrice(currentPrice)}
                            </span>
                        </div>

                        {/* Dual Action Buttons */}
                        <div className="flex items-center gap-2 flex-1 justify-end">
                            <button
                                onClick={handleAddToCart}
                                disabled={isOutOfStock}
                                className="px-3.5 h-11 bg-stone-100 text-stone-900 rounded-full flex items-center justify-center gap-1.5 text-[11px] font-extrabold tracking-wider uppercase border border-stone-300 active:scale-95 transition-all"
                            >
                                <FiShoppingBag size={14} /> Bag
                            </button>
                            <button
                                onClick={handleBuyNow}
                                disabled={isOutOfStock}
                                className="flex-1 max-w-[150px] h-11 bg-stone-900 text-white rounded-full flex items-center justify-center gap-1.5 text-[11px] font-extrabold tracking-widest uppercase shadow-lg shadow-stone-900/20 active:scale-95 transition-all"
                            >
                                <FiZap size={13} className="text-amber-400" /> BUY NOW
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* FULL-SCREEN IMAGE LIGHTBOX MODAL */}
            {isLightboxOpen && isMounted && createPortal(
                <div
                    className="fixed inset-0 z-[999999] bg-black/95 backdrop-blur-lg flex flex-col justify-between animate-fade-in text-white select-none"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col">
                            <h3 className="font-light text-sm sm:text-base text-stone-200">{product.name}</h3>
                            <span className="text-[11px] text-stone-400 uppercase tracking-widest font-bold">
                                Image {activeImageIdx + 1} of {product.images.length}
                            </span>
                        </div>
                        <button
                            onClick={() => setIsLightboxOpen(false)}
                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                        >
                            <FiX size={20} />
                        </button>
                    </div>

                    {/* Main Image View */}
                    <div
                        className="flex-1 relative flex items-center justify-center px-4 max-h-[75vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Prev Button */}
                        {product.images.length > 1 && (
                            <button
                                onClick={() => setActiveImageIdx(prev => (prev === 0 ? product.images.length - 1 : prev - 1))}
                                className="absolute left-4 sm:left-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center z-10 transition-all text-white backdrop-blur-md"
                            >
                                <FiChevronLeft size={24} />
                            </button>
                        )}

                        <div className="relative w-full h-full max-w-4xl max-h-[75vh]">
                            <Image
                                src={product.images[activeImageIdx]}
                                alt={product.name}
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>

                        {/* Next Button */}
                        {product.images.length > 1 && (
                            <button
                                onClick={() => setActiveImageIdx(prev => (prev === product.images.length - 1 ? 0 : prev + 1))}
                                className="absolute right-4 sm:right-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center z-10 transition-all text-white backdrop-blur-md"
                            >
                                <FiChevronRight size={24} />
                            </button>
                        )}
                    </div>

                    {/* Thumbnails Row */}
                    <div
                        className="p-4 sm:p-6 flex justify-center gap-3 overflow-x-auto hide-scrollbar"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {product.images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveImageIdx(idx)}
                                className={`relative w-14 h-18 sm:w-16 sm:h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                                    activeImageIdx === idx ? 'border-white scale-105 shadow-lg ring-2 ring-white/50' : 'border-transparent opacity-50 hover:opacity-100'
                                }`}
                            >
                                <Image src={img} alt={`thumb-${idx}`} fill className="object-cover" />
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}

            {/* PREMIUM SIZE GUIDE MODAL */}
            {isSizeGuideOpen && isMounted && createPortal(
                <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex flex-col justify-end sm:items-center sm:justify-center animate-fade-in" style={{ zIndex: 999999 }}>
                    <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col h-[85vh] sm:h-[80vh] shadow-2xl">

                        <div className="px-5 py-4 border-b border-stone-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setIsSizeGuideOpen(false)} className="w-8 h-8 flex items-center justify-center text-stone-900 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors">
                                    <FiX size={18} />
                                </button>
                                <h3 className="text-base sm:text-lg font-bold text-stone-900">Size Chart • {product.category || 'Atelier'}</h3>
                            </div>
                        </div>

                        <div className="flex border-b border-stone-200 bg-white sticky top-[65px] z-10 px-4">
                            <button onClick={() => setSizeGuideTab('chart')} className={`flex-1 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-colors border-b-2 ${sizeGuideTab === 'chart' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400'}`}>Size Chart</button>
                            <button onClick={() => setSizeGuideTab('fit')} className={`flex-1 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-colors border-b-2 ${sizeGuideTab === 'fit' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400'}`}>Fit Guide</button>
                            <button onClick={() => setSizeGuideTab('measure')} className={`flex-1 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-colors border-b-2 ${sizeGuideTab === 'measure' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400'}`}>How To Measure</button>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-white p-4 sm:p-6 custom-scrollbar">
                            {sizeGuideTab === 'chart' && (
                                <div className="animate-fade-in">
                                    <div className="overflow-x-auto hide-scrollbar border border-stone-200 rounded-2xl">
                                        <table className="min-w-full text-left text-xs sm:text-sm">
                                            <thead className="bg-stone-50">
                                                <tr>
                                                    <th className="py-3 px-4 font-bold text-stone-900 border-b border-stone-200">Size</th>
                                                    <th className="py-3 px-4 font-bold text-stone-900 border-b border-stone-200">To Fit Chest (in)</th>
                                                    <th className="py-3 px-4 font-bold text-stone-900 border-b border-stone-200">Garment Chest (in)</th>
                                                    <th className="py-3 px-4 font-bold text-stone-900 border-b border-stone-200">Length (in)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-stone-600">
                                                {['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((sz, i) => (
                                                    <tr key={sz} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                                                        <td className="py-3.5 px-4 font-bold text-stone-900">{sz}</td>
                                                        <td className="py-3.5 px-4">{34 + (i * 2)}</td>
                                                        <td className="py-3.5 px-4">{40 + (i * 2)}</td>
                                                        <td className="py-3.5 px-4">{26 + (i * 0.5)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {sizeGuideTab === 'fit' && (
                                <div className="animate-fade-in text-center pt-2">
                                    <div className="w-full bg-white rounded-2xl overflow-hidden mb-4 border border-stone-100 p-4">
                                        <img src="/fitsize.png" alt="Fit Guide" className="w-full h-auto object-contain mix-blend-multiply mx-auto" />
                                    </div>
                                    <p className="text-xs text-stone-500 italic">For a more relaxed silhouette, we recommend ordering one size up.</p>
                                </div>
                            )}

                            {sizeGuideTab === 'measure' && (
                                <div className="animate-fade-in pt-2 pb-6">
                                    <div className="w-full bg-white rounded-2xl overflow-hidden mb-5 flex justify-center border border-stone-100 p-4">
                                        <img src="/sizeguide.png" alt="How to Measure" className="w-full sm:w-[75%] h-auto object-contain mix-blend-multiply" />
                                    </div>
                                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                                        <p className="text-xs font-bold text-stone-900 mb-1">Measurement Instructions</p>
                                        <p className="text-xs text-stone-600 leading-relaxed">
                                            Keep the measuring tape comfortably loose. Measure chest across fullest part and length from the high point of shoulder to lower hem.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}