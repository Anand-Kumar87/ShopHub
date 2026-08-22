'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
    FiShoppingBag, FiHeart, FiStar, FiTruck, FiMinus, FiPlus,
    FiChevronRight, FiRefreshCcw, FiX, FiMessageSquare, FiShare2,
    FiChevronDown, FiChevronUp, FiCheckCircle, FiCamera
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// Global Contexts & Supabase
import { useCart } from '../../context/CartContext';
import { useGlobalCurrency } from '../../context/CurrencyContext';
import { useWishlist } from '../../context/WishlistContext';
import { supabase } from '../../utils/supabase';

// Magnetic Button Import
import MagneticButton from '../../components/MagneticButton';

export default function ProductDetails() {
    const params = useParams();
    const router = useRouter();
    const productId = params?.id;

    const { addToCart } = useCart();
    const { convertPrice, freeShippingThreshold } = useGlobalCurrency() || { convertPrice: (v) => `₹${Number(v).toFixed(2)}`, freeShippingThreshold: 0 };
    const { wishlistItems, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist() || { isInWishlist: () => false };

    // Component States
    const [isMounted, setIsMounted] = useState(false);
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedSize, setSelectedSize] = useState('');

    // UI States
    const [activeTab, setActiveTab] = useState('details');
    const [openAccordion, setOpenAccordion] = useState(null);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewText, setReviewText] = useState('');

    // 🔥 NEW: Image Upload for Reviews
    const [reviewImages, setReviewImages] = useState([]);

    // Size Guide States
    const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
    const [sizeGuideTab, setSizeGuideTab] = useState('chart');

    // REAL PINCODE STATES
    const [pincode, setPincode] = useState('');
    const [pinLoading, setPinLoading] = useState(false);
    const [pinMessage, setPinMessage] = useState(null);

    const imageScrollRef = useRef(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // FETCH REAL DATA FROM SUPABASE
    useEffect(() => {
        // 🔥 NEW FIX: Page open होते ही सबसे ऊपर (Top) स्क्रॉल कर देगा
        window.scrollTo({ top: 0, behavior: 'instant' });

        const fetchProduct = async () => {
            if (!productId) return;
            setIsLoading(true);

            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', productId)
                    .single();

                if (error || !data) {
                    toast.error("Piece not found in catalog.");
                    router.push('/shop');
                    return;
                }

                const formattedProduct = {
                    ...data,
                    colors: data.colors || [],
                    sizes: data.sizes || [],
                    images: data.images?.length ? data.images : (data.image ? [data.image] : ['https://images.unsplash.com/photo-1434389670869-c87510fed58f?auto=format&fit=crop&w=800&q=80']),
                    reviews: data.reviews || [],
                    rating: data.rating || 5.0
                };

                setProduct(formattedProduct);
                if (formattedProduct.colors.length > 0) setSelectedColor(formattedProduct.colors[0]);
                if (formattedProduct.sizes.length > 0) setSelectedSize(formattedProduct.sizes[0]);

                let fetchedRelated = [];

                let { data: sameCatData } = await supabase
                    .from('products')
                    .select('*')
                    .ilike('category', formattedProduct.category || '')
                    .neq('id', formattedProduct.id)
                    .eq('status', 'active')
                    .limit(4);

                fetchedRelated = sameCatData || [];

                if (fetchedRelated.length < 4) {
                    const excludeIds = [formattedProduct.id, ...fetchedRelated.map(p => p.id)];
                    let query = supabase
                        .from('products')
                        .select('*')
                        .eq('status', 'active')
                        .limit(10);

                    excludeIds.forEach(id => { query = query.neq('id', id); });

                    const { data: anyCatData } = await query;

                    if (anyCatData) {
                        const existingIds = new Set(fetchedRelated.map(p => p.id));
                        const fillData = anyCatData.filter(p => !existingIds.has(p.id));
                        fetchedRelated = [...fetchedRelated, ...fillData].slice(0, 4);
                    }
                }

                setRelatedProducts(fetchedRelated);

            } catch (err) {
                console.error("Network Error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [productId, router]);

    const handleScroll = (e) => {
        const scrollLeft = e.target.scrollLeft;
        const width = e.target.clientWidth;
        const newIndex = Math.round(scrollLeft / width);
        if (newIndex !== activeImageIdx) setActiveImageIdx(newIndex);
    };

    const increaseQuantity = () => setQuantity(prev => (product && prev < product.stock ? prev + 1 : prev));
    const decreaseQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

    const handleAddToCart = () => {
        if (!product) return;
        if (product.sizes?.length > 0 && !selectedSize) return toast.error("Please select a size first.");
        addToCart({ ...product, color: selectedColor, size: selectedSize }, quantity);
        toast.success(
            <div className="flex flex-col">
                <span className="font-bold">{product.name}</span>
                <span className="text-sm">Added to your bag ({quantity}x)</span>
            </div>,
            { icon: '🛍️' }
        );
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
        const shareData = { title: `${product.name} | ShopHub.`, text: `Check out this premium piece on ShopHub.`, url: window.location.href };
        if (navigator.share) { try { await navigator.share(shareData); } catch (err) { } }
        else { navigator.clipboard.writeText(window.location.href); toast.success('Link copied to clipboard!', { icon: '🔗' }); }
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
                deliveryDate.setDate(deliveryDate.getDate() + 4);
                const dateString = deliveryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

                setPinMessage({ type: 'success', text: `✅ Delivery to ${location}. Expected by ${dateString}.` });
            } else {
                setPinMessage({ type: 'error', text: '❌ Invalid Pincode. Please check and try again.' });
            }
        } catch (error) {
            setPinMessage({ type: 'error', text: '❌ Unable to verify pincode at the moment.' });
        } finally {
            setPinLoading(false);
        }
    };

    // 🔥 NEW: Image Upload Handler for Reviews
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

        let reviewerName = 'Verified Buyer';
        try {
            const localUser = JSON.parse(localStorage.getItem('currentUser'));
            if (localUser && localUser.firstName) reviewerName = `${localUser.firstName} ${localUser.lastName || ''}`.trim();
        } catch (err) { console.warn("Could not fetch user name"); }

        const newReview = {
            user: reviewerName,
            rating: reviewRating,
            text: reviewText,
            images: reviewImages, // Save uploaded images
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
        setReviewImages([]); // Clear images after submit

        try {
            const { error } = await supabase.from('products').update({ reviews: updatedReviews, rating: newAverageRating }).eq('id', product.id);
            if (error) toast.error("Failed to sync review with server.");
            else toast.success("Thank you! Your review is now live.", { icon: '✨' });
        } catch (error) { toast.error("Network error while saving review."); }
    };

    const isClothingCategory = product ? ['clothing', 'apparel', 't-shirt', 'shirt', 'dress', 'jeans', 'bottoms', 'tops', 'outerwear', 'hoodie'].some(cat => product.category?.toLowerCase().includes(cat)) : false;

    // 🔥 DUMMY REVIEWS for Marquee Animation if product has no reviews
    const displayReviewsForMarquee = product?.reviews?.length > 0 ? product.reviews : [
        { user: "Nikhil A.", text: "Product quality is really good and premium.", rating: 5 },
        { user: "Anjali V.", text: "Quality is really good and feels very positive.", rating: 5 },
        { user: "Rahul S.", text: "Absolutely love the fit and fabric! Very comfortable.", rating: 5 },
        { user: "Priya M.", text: "Looks exactly like the picture. Worth the price.", rating: 4 }
    ];

    if (isLoading || !product) {
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

    return (
        <>
            {/* 🔥 CSS FOR INFINITE SCROLLING MARQUEE */}
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

            <main className="bg-stone-50 min-h-screen pb-32 pt-24 animate-fade-in relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Breadcrumb */}
                    <nav className="flex items-center text-xs tracking-widest uppercase font-bold text-stone-400 mb-8 border-b border-stone-200/50 pb-4">
                        <Link href="/" className="hover:text-stone-900 transition-colors">Home</Link>
                        <FiChevronRight className="mx-2 text-stone-300" />
                        <Link href="/shop" className="hover:text-stone-900 transition-colors">Shop</Link>
                        <FiChevronRight className="mx-2 text-stone-300" />
                        <Link href={`/shop?category=${product.category?.toLowerCase()}`} className="hover:text-stone-900 transition-colors truncate max-w-[120px] sm:max-w-none">
                            {product.category || 'Collection'}
                        </Link>
                        <FiChevronRight className="mx-2 text-stone-300" />
                        <span className="text-stone-900 truncate max-w-[150px] sm:max-w-none">{product.name}</span>
                    </nav>

                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-stone-200/40 w-full border border-stone-100 flex flex-col lg:flex-row overflow-hidden">

                        {/* LEFT: IMAGE GALLERY */}
                        <div className="w-full lg:w-1/2 p-6 sm:p-10 lg:p-12 bg-stone-50/30 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-stone-100 relative">
                            <div className="hidden md:flex flex-col gap-4 w-full relative">
                                <div className="relative w-full aspect-[4/5] max-h-[580px] bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200/60">
                                    <Image src={product.images[activeImageIdx]} alt={product.name} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover transition-opacity duration-500" priority />
                                    <button onClick={handleShare} className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm text-stone-900 z-10 hover:bg-stone-900 hover:text-white transition-colors">
                                        <FiShare2 size={18} />
                                    </button>
                                </div>
                                {product.images.length > 1 && (
                                    <div className="flex gap-4 overflow-x-auto hide-scrollbar py-2">
                                        {product.images.map((img, idx) => (
                                            <button key={idx} onClick={() => setActiveImageIdx(idx)} className={`relative w-20 h-24 sm:w-24 sm:h-28 flex-shrink-0 rounded-xl overflow-hidden border transition-all ${activeImageIdx === idx ? 'border-stone-900 shadow-md ring-1 ring-stone-900 ring-offset-1' : 'border-stone-200 opacity-60 hover:opacity-100'}`}>
                                                <Image src={img} alt={`thumbnail-${idx}`} fill sizes="96px" className="object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex md:hidden relative w-full aspect-[3/4] bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200/60 group">
                                <div ref={imageScrollRef} onScroll={handleScroll} className="flex w-full h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar scroll-smooth">
                                    {product.images.map((img, idx) => (
                                        <div key={idx} className="min-w-full h-full snap-center relative flex-shrink-0">
                                            <Image src={img} alt={`${product.name} - ${idx + 1}`} fill sizes="(max-width: 768px) 100vw, 800px" className="object-cover" priority={idx === 0} />
                                        </div>
                                    ))}
                                </div>
                                <button onClick={handleShare} className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm text-stone-900 z-10">
                                    <FiShare2 size={18} />
                                </button>
                                {product.images.length > 1 && (
                                    <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2 z-10">
                                        {product.images.map((_, idx) => (
                                            <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${activeImageIdx === idx ? 'w-6 bg-stone-900' : 'w-1.5 bg-white/70 backdrop-blur-md'}`} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: CONTENT & ACCORDIONS */}
                        <div className="w-full lg:w-1/2 p-8 sm:p-10 lg:p-12 flex flex-col">

                            <div className="flex gap-8 border-b border-stone-200 mb-8">
                                <button onClick={() => setActiveTab('details')} className={`pb-3 text-sm font-bold tracking-widest uppercase transition-colors relative ${activeTab === 'details' ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}>
                                    Details
                                    {activeTab === 'details' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-stone-900"></span>}
                                </button>
                                <button onClick={() => setActiveTab('reviews')} className={`pb-3 text-sm font-bold tracking-widest uppercase transition-colors relative flex items-center gap-2 ${activeTab === 'reviews' ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}>
                                    Reviews <span className="bg-stone-100 text-stone-500 px-2 py-0.5 rounded text-[10px]">{product.reviews?.length || 0}</span>
                                    {activeTab === 'reviews' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-stone-900"></span>}
                                </button>
                            </div>

                            {activeTab === 'details' && (
                                <div className="flex-1 animate-fade-in flex flex-col">
                                    <span className="text-stone-400 font-bold tracking-widest uppercase text-[10px] sm:text-xs mb-2 block">
                                        {product.category || 'Collection'}
                                    </span>
                                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-stone-900 mb-4 leading-tight">{product.name}</h1>

                                    <div className="flex items-center gap-5 mb-8">
                                        <div className="flex items-end gap-3">
                                            <span className="text-2xl sm:text-3xl font-bold text-stone-900">
                                                {convertPrice(product.salePrice || product.price)}
                                            </span>
                                            {product.oldPrice && (
                                                <span className="text-sm sm:text-base text-stone-400 line-through mb-1">
                                                    {convertPrice(product.oldPrice)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="h-6 w-px bg-stone-200"></div>
                                        <div className="flex items-center text-sm text-stone-500 cursor-pointer hover:text-stone-900" onClick={() => setActiveTab('reviews')}>
                                            <FiStar className="text-yellow-400 fill-current mr-1.5" size={16} />
                                            <span className="font-bold text-stone-700 mr-1">{product.rating || 5.0}</span>
                                            <span>({product.reviews?.length || 0} Reviews)</span>
                                        </div>
                                    </div>

                                    {product.colors && product.colors.length > 0 && (
                                        <div className="mb-8">
                                            <h3 className="text-xs font-bold tracking-widest uppercase text-stone-900 mb-3.5">Color</h3>
                                            <div className="flex gap-3">
                                                {product.colors.map((color, idx) => (
                                                    <button
                                                        key={color}
                                                        onClick={() => {
                                                            setSelectedColor(color);
                                                            // 🔥 COLOR SYNC FIX: Change Image based on color index
                                                            if (product.images[idx]) {
                                                                setActiveImageIdx(idx);
                                                                if (imageScrollRef.current) {
                                                                    const width = imageScrollRef.current.clientWidth;
                                                                    imageScrollRef.current.scrollTo({ left: width * idx, behavior: 'smooth' });
                                                                }
                                                            }
                                                        }}
                                                        className={`w-10 h-10 rounded-full border transition-all flex items-center justify-center ${selectedColor === color ? 'border-stone-900 ring-1 ring-offset-2 ring-stone-900 shadow-md' : 'border-stone-300 hover:border-stone-500'}`}
                                                    >
                                                        <span className="w-8 h-8 rounded-full block border border-stone-200/50" style={{ backgroundColor: color }}></span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {product.sizes && product.sizes.length > 0 && (
                                        <div className="mb-8">
                                            <div className="flex justify-between items-center mb-3.5">
                                                <h3 className="text-xs font-bold tracking-widest uppercase text-stone-900">Please select a size.</h3>
                                                {isClothingCategory && (
                                                    <button onClick={() => setIsSizeGuideOpen(true)} className="text-xs text-teal-700 font-bold uppercase tracking-widest cursor-pointer hover:underline transition-colors">
                                                        Size Chart
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                {product.sizes.map(size => (
                                                    <button key={size} onClick={() => setSelectedSize(size)} className={`px-6 py-3 min-w-[3rem] rounded-lg border text-sm font-bold transition-all ${selectedSize === size ? 'border-stone-900 bg-stone-900 text-white shadow-md' : 'border-stone-200 text-stone-600 hover:border-stone-400 hover:bg-stone-50'}`}>
                                                        {size}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* REAL PINCODE SECTION */}
                                    <div className="mb-8 border-t border-stone-100 pt-6">
                                        <h3 className="text-sm font-bold text-stone-900 mb-3.5">Delivery Details</h3>
                                        <div className={`flex items-center border ${pinMessage?.type === 'error' ? 'border-red-400' : pinMessage?.type === 'success' ? 'border-green-400' : 'border-stone-300'} rounded-xl overflow-hidden h-12 mb-2 transition-colors`}>
                                            <input
                                                type="text"
                                                placeholder="Enter Pincode"
                                                value={pincode}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                    setPincode(val);
                                                    if (pinMessage) setPinMessage(null);
                                                }}
                                                className="flex-1 px-4 text-sm focus:outline-none"
                                                maxLength={6}
                                            />
                                            <button
                                                onClick={handleCheckPincode}
                                                disabled={pinLoading || pincode.length < 6}
                                                className="px-5 font-bold text-teal-700 text-xs tracking-widest h-full bg-stone-50 border-l border-stone-200 hover:bg-stone-100 disabled:opacity-50 transition-colors"
                                            >
                                                {pinLoading ? '...' : 'CHECK'}
                                            </button>
                                        </div>

                                        {pinMessage && (
                                            <p className={`text-xs mb-3 font-bold animate-fade-in ${pinMessage.type === 'success' ? 'text-teal-700' : 'text-red-500'}`}>
                                                {pinMessage.text}
                                            </p>
                                        )}

                                        <div className="bg-stone-50 rounded-xl p-4 flex gap-3 text-sm text-stone-700 border border-stone-100 mt-2">
                                            <FiRefreshCcw className="flex-shrink-0 mt-0.5 text-stone-400" size={18} />
                                            <p>This product is eligible for return or exchange under our 30-day return or exchange policy. No questions asked.</p>
                                        </div>
                                    </div>

                                    {/* DESKTOP ACTIONS ROW */}
                                    <div className="hidden md:flex flex-wrap sm:flex-nowrap gap-4 pt-4 mt-2 border-t border-stone-100 items-center">
                                        <div className="flex items-center justify-between w-[120px] h-[52px] bg-white border border-stone-200 rounded-full px-2 shadow-sm">
                                            <button onClick={decreaseQuantity} className="w-10 h-10 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded-full transition-colors">
                                                <FiMinus size={18} />
                                            </button>
                                            <span className="font-bold text-[15px] text-stone-900 select-none">{quantity}</span>
                                            <button onClick={increaseQuantity} className="w-10 h-10 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded-full transition-colors">
                                                <FiPlus size={18} />
                                            </button>
                                        </div>

                                        <MagneticButton className="flex-1 min-w-[200px]">
                                            <button onClick={handleAddToCart} className="w-full h-[52px] bg-[#111111] text-white rounded-full text-xs font-bold tracking-widest uppercase hover:bg-black transition-colors shadow-lg shadow-stone-900/10 flex items-center justify-center gap-2">
                                                <FiShoppingBag size={16} /> ADD TO BAG
                                            </button>
                                        </MagneticButton>

                                        <button
                                            onClick={handleWishlistToggle}
                                            className={`w-[52px] h-[52px] flex-shrink-0 border border-stone-200 rounded-full flex items-center justify-center transition-all ${isWishlisted ? 'bg-red-50 text-red-500 border-red-200' : 'bg-white text-stone-400 hover:text-stone-900 hover:bg-stone-50 shadow-sm'}`}
                                        >
                                            <FiHeart size={20} className={isWishlisted ? 'fill-current text-red-500' : ''} />
                                        </button>
                                    </div>

                                    {/* Dynamic Accordions */}
                                    <div className="space-y-0 border-t border-stone-200 mt-10 pt-4">
                                        <div className="border-b border-stone-200">
                                            <button onClick={() => setOpenAccordion(openAccordion === 'details' ? null : 'details')} className="w-full py-5 flex justify-between items-center text-left">
                                                <span className="font-bold text-stone-900 text-[15px]">Product Details</span>
                                                {openAccordion === 'details' ? <FiChevronUp size={20} className="text-stone-400" /> : <FiChevronDown size={20} className="text-stone-400" />}
                                            </button>
                                            {openAccordion === 'details' && (
                                                <div className="pb-5 text-sm text-stone-600 space-y-2 animate-fade-in">
                                                    <p><strong>Category:</strong> <span className="capitalize">{product.category || 'Apparel'}</span></p>
                                                    {product.sku && <p><strong>SKU:</strong> {product.sku}</p>}
                                                    {product.colors?.length > 0 && <p><strong>Colors:</strong> {product.colors.join(', ')}</p>}
                                                    {product.sizes?.length > 0 && <p><strong>Sizes:</strong> {product.sizes.join(', ')}</p>}
                                                    <p><strong>Authenticity:</strong> 100% Original Premium Product</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="border-b border-stone-200">
                                            <button onClick={() => setOpenAccordion(openAccordion === 'description' ? null : 'description')} className="w-full py-5 flex justify-between items-center text-left">
                                                <span className="font-bold text-stone-900 text-[15px]">Product Description</span>
                                                {openAccordion === 'description' ? <FiChevronUp size={20} className="text-stone-400" /> : <FiChevronDown size={20} className="text-stone-400" />}
                                            </button>
                                            {openAccordion === 'description' && (
                                                <div className="pb-5 text-sm text-stone-600 leading-relaxed animate-fade-in whitespace-pre-wrap">
                                                    {product.description || "Premium quality product tailored to perfection."}
                                                </div>
                                            )}
                                        </div>
                                        <div className="border-b border-stone-200">
                                            <button onClick={() => setOpenAccordion(openAccordion === 'artist' ? null : 'artist')} className="w-full py-5 flex justify-between items-center text-left">
                                                <span className="font-bold text-stone-900 text-[15px]">Artist's Details</span>
                                                {openAccordion === 'artist' ? <FiChevronUp size={20} className="text-stone-400" /> : <FiChevronDown size={20} className="text-stone-400" />}
                                            </button>
                                            {openAccordion === 'artist' && (
                                                <div className="pb-5 text-sm text-stone-600 animate-fade-in">
                                                    Designed exclusively for ShopHub. We prioritize high-quality craftsmanship and modern aesthetics.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div className="flex-1 flex flex-col animate-fade-in h-full w-full overflow-hidden">

                                    {/* 🔥 ANIMATED REVIEWS MARQUEE */}
                                    <div className="mb-10 bg-[#fbf9f4] py-8 rounded-3xl relative overflow-hidden shadow-inner border border-stone-200/50">
                                        <div className="text-center mb-6 px-4">
                                            <h3 className="text-xl sm:text-2xl font-bold text-stone-900 mb-1">Our customers love us</h3>
                                            <p className="text-xs sm:text-sm text-stone-600 font-medium">{product.rating || 5.0} star Based on {product.reviews?.length || 2464} reviews</p>
                                        </div>
                                        <div className="animate-marquee flex gap-4 px-4 w-max">
                                            {[...displayReviewsForMarquee, ...displayReviewsForMarquee].map((rev, idx) => (
                                                <div key={idx} className="bg-white rounded-2xl px-5 py-4 flex flex-col justify-center gap-2 shadow-sm border border-stone-100 min-w-[280px] max-w-[300px]">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex text-yellow-400 text-xs">
                                                            {[...Array(5)].map((_, i) => <FiStar key={i} className={i < (rev.rating || 5) ? 'fill-current' : 'text-stone-200'} />)}
                                                        </div>
                                                        <span className="text-[10px] text-stone-400 ml-auto">Verified</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-stone-900 flex items-center gap-1.5 truncate">
                                                        {rev.user} <FiCheckCircle className="text-stone-900" size={14} />
                                                    </p>
                                                    <p className="text-xs text-stone-600 truncate">{rev.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* REVIEWS LIST */}
                                    <div className="flex-1 overflow-y-auto pr-3 space-y-8 mb-8 max-h-[450px] hide-scrollbar">
                                        {product.reviews?.length > 0 ? product.reviews.map((rev, i) => (
                                            <div key={i} className="border-b border-stone-100 pb-8">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="font-bold text-stone-900 block text-sm flex items-center gap-1.5">
                                                            {rev.user} <FiCheckCircle className="text-stone-900" size={14} />
                                                        </span>
                                                        <span className="text-xs text-stone-400 font-medium">{rev.date}</span>
                                                    </div>
                                                    <div className="flex text-yellow-400 text-sm">
                                                        {[...Array(5)].map((_, idx) => <FiStar key={idx} className={idx < rev.rating ? 'fill-current' : 'text-stone-200'} />)}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-stone-600 leading-relaxed mt-3">{rev.text}</p>

                                                {/* 🔥 REVIEW IMAGES DISPLAY */}
                                                {rev.images && rev.images.length > 0 && (
                                                    <div className="flex gap-3 mt-4 overflow-x-auto hide-scrollbar pb-2">
                                                        {rev.images.map((img, imgIdx) => (
                                                            <div key={imgIdx} className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 border border-stone-200 shadow-sm">
                                                                <img src={img} alt="Customer upload" className="w-full h-full object-cover" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )) : (
                                            <div className="text-center py-8">
                                                <FiMessageSquare className="w-10 h-10 text-stone-200 mx-auto mb-4" />
                                                <p className="text-stone-500 text-sm">No reviews yet. Be the first to review!</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* WRITE A REVIEW FORM WITH IMAGE UPLOAD */}
                                    <div className="bg-stone-50 p-6 sm:p-8 rounded-3xl border border-stone-100 mt-auto">
                                        <h4 className="text-xs font-bold tracking-widest uppercase text-stone-900 mb-5">Write a Review</h4>
                                        <form onSubmit={submitReview}>
                                            <div className="flex gap-1.5 mb-4">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button type="button" key={star} onClick={() => setReviewRating(star)} className="focus:outline-none">
                                                        <FiStar size={24} className={star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-300 hover:text-yellow-200 transition-colors'} />
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="What did you like or dislike?" rows="3" className="w-full bg-white border border-stone-200 rounded-xl p-4 text-sm focus:outline-none focus:border-stone-900 mb-4 resize-none shadow-sm"></textarea>

                                            {/* 🔥 IMAGE UPLOAD BUTTON */}
                                            <div className="mb-5">
                                                <label className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-stone-500 mb-3 cursor-pointer w-max hover:text-stone-900 transition-colors">
                                                    <FiCamera size={18} /> Upload Photos
                                                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                                                </label>
                                                {reviewImages.length > 0 && (
                                                    <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                                                        {reviewImages.map((src, idx) => (
                                                            <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-stone-200 shadow-sm flex-shrink-0">
                                                                <img src={src} className="w-full h-full object-cover" />
                                                                <button type="button" onClick={() => setReviewImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 w-4 h-4 bg-black/50 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-500"><FiX /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <button type="submit" className="w-full bg-stone-900 text-white rounded-xl py-3.5 text-xs font-bold tracking-widest uppercase hover:bg-stone-800 transition-colors shadow-md">Submit Review</button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 🔥 OTHERS ALSO BOUGHT */}
                    {relatedProducts.length > 0 && (
                        <div className="mt-16 pt-8 border-t border-stone-200 w-full">
                            <h3 className="text-xl sm:text-2xl font-bold text-stone-900 mb-6">Others Also Bought</h3>
                            <div className="flex gap-4 sm:gap-6 overflow-x-auto hide-scrollbar pb-6 snap-x">
                                {relatedProducts.map((rp, index) => (
                                    <Link key={`${rp.id}-${index}`} href={`/product/${rp.id}`} className="min-w-[180px] sm:min-w-[220px] max-w-[180px] sm:max-w-[220px] snap-start group">
                                        <div className="w-full aspect-[4/5] bg-stone-100 rounded-2xl overflow-hidden mb-3 relative border border-stone-200/60 shadow-sm">
                                            <Image src={rp.images?.[0] || rp.image} alt={rp.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" sizes="(max-width: 640px) 180px, 220px" />
                                            <div className="absolute bottom-2 left-2 bg-stone-900/90 backdrop-blur text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-widest shadow-lg">Premium</div>
                                        </div>
                                        <p className="text-sm font-bold text-stone-900 truncate">{rp.name}</p>
                                        <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mt-0.5">{rp.category || 'Apparel'}</p>
                                        <p className="text-sm font-bold text-stone-900 mt-1.5">{convertPrice(rp.salePrice || rp.price)}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* PORTAL FOR MOBILE STICKY BOTTOM ACTION BAR (BLACK BUTTON) */}
            {isMounted && createPortal(
                <div
                    className="md:hidden"
                    style={{
                        position: 'fixed',
                        bottom: '0',
                        width: '100%',
                        left: '0',
                        padding: '10px 16px',
                        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
                        background: '#fff',
                        zIndex: 999999,
                        transform: 'translateZ(0)',
                        WebkitTransform: 'translateZ(0)',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden'
                    }}
                >
                    <div className="flex items-center justify-between gap-3 h-[52px] max-w-md mx-auto">
                        <button
                            onClick={handleWishlistToggle}
                            className={`w-[52px] h-[52px] flex-shrink-0 border border-stone-200 rounded-full flex items-center justify-center transition-all ${isWishlisted ? 'bg-red-50 text-red-500 border-red-200' : 'bg-white text-stone-400 hover:text-stone-900 hover:bg-stone-50 shadow-sm'}`}
                            aria-label="Add to Wishlist"
                        >
                            <FiHeart size={20} className={isWishlisted ? 'fill-current text-red-500' : ''} />
                        </button>
                        <button
                            onClick={handleAddToCart}
                            className="flex-1 h-[52px] bg-[#111111] text-white rounded-full flex items-center justify-center gap-2 text-xs font-bold tracking-widest uppercase shadow-lg shadow-stone-900/10 active:bg-black"
                        >
                            <FiShoppingBag size={16} /> ADD TO BAG
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {/* PREMIUM SIZE GUIDE MODAL */}
            {isSizeGuideOpen && isMounted && createPortal(
                <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex flex-col justify-end sm:items-center sm:justify-center animate-fade-in" style={{ zIndex: 9999999 }}>
                    <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col h-[85vh] sm:h-[80vh] shadow-2xl">

                        <div className="px-4 py-4 sm:p-6 border-b border-stone-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setIsSizeGuideOpen(false)} className="w-8 h-8 flex items-center justify-center text-stone-900 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors">
                                    <FiX size={18} />
                                </button>
                                <h3 className="text-lg font-bold text-stone-900">Size Chart - {product.category || 'Apparel'}</h3>
                            </div>
                        </div>

                        <div className="flex border-b border-stone-200 bg-white sticky top-[65px] sm:top-[77px] z-10 px-4">
                            <button onClick={() => setSizeGuideTab('chart')} className={`flex-1 py-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors border-b-2 ${sizeGuideTab === 'chart' ? 'border-teal-700 text-teal-800' : 'border-transparent text-stone-400'}`}>Size Chart</button>
                            <button onClick={() => setSizeGuideTab('fit')} className={`flex-1 py-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors border-b-2 ${sizeGuideTab === 'fit' ? 'border-teal-700 text-teal-800' : 'border-transparent text-stone-400'}`}>Fit Guide</button>
                            <button onClick={() => setSizeGuideTab('measure')} className={`flex-1 py-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors border-b-2 ${sizeGuideTab === 'measure' ? 'border-teal-700 text-teal-800' : 'border-transparent text-stone-400'}`}>How To Measure</button>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-white p-4 sm:p-6 custom-scrollbar">
                            {sizeGuideTab === 'chart' && (
                                <div className="animate-fade-in">
                                    <div className="flex justify-end mb-4 border-b border-stone-100 pb-2">
                                        <div className="flex text-[10px] font-bold uppercase tracking-widest text-stone-500 gap-4">
                                            <span className="text-teal-700 border-b-2 border-teal-700 pb-2">Size in Inches</span>
                                            <span>Size in CM</span>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto hide-scrollbar border border-stone-200 rounded-xl">
                                        <table className="min-w-full text-left text-xs sm:text-sm">
                                            <thead className="bg-stone-50">
                                                <tr>
                                                    <th className="py-3 px-4 font-bold text-stone-900 border-b border-stone-200">Size</th>
                                                    <th className="py-3 px-4 font-bold text-stone-900 border-b border-stone-200">To Fit Chest</th>
                                                    <th className="py-3 px-4 font-bold text-stone-900 border-b border-stone-200">Garment Chest</th>
                                                    <th className="py-3 px-4 font-bold text-stone-900 border-b border-stone-200">Length</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-stone-600">
                                                {['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((sz, i) => (
                                                    <tr key={sz} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                                                        <td className="py-4 px-4 font-bold text-stone-900 flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full border border-stone-300"></div> {sz}
                                                        </td>
                                                        <td className="py-4 px-4">{34 + (i * 2)}</td>
                                                        <td className="py-4 px-4">{40 + (i * 2)}</td>
                                                        <td className="py-4 px-4">{26 + (i * 0.5)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-xs text-teal-700 font-bold mt-4 text-center">Scroll to the right for more details ➔</p>
                                </div>
                            )}

                            {sizeGuideTab === 'fit' && (
                                <div className="animate-fade-in text-center pt-2">
                                    <div className="w-full bg-white rounded-xl overflow-hidden mb-4">
                                        <img src="/fitsize.png" alt="Fit Guide" className="w-full h-auto object-contain mix-blend-multiply" />
                                    </div>
                                    <p className="text-sm text-stone-500 italic mt-4">For the best comfort, we recommend matching the fit style to your personal preference.</p>
                                </div>
                            )}

                            {sizeGuideTab === 'measure' && (
                                <div className="animate-fade-in pt-2 pb-8">
                                    <div className="w-full bg-white rounded-xl overflow-hidden mb-6 flex justify-center">
                                        <img src="/sizeguide.png" alt="How to Measure" className="w-full sm:w-[80%] h-auto object-contain mix-blend-multiply" />
                                    </div>
                                    <div className="bg-stone-50 p-5 rounded-xl border border-stone-200">
                                        <p className="text-xs sm:text-sm font-bold text-stone-900 mb-2">Need help measuring?</p>
                                        <p className="text-xs text-stone-600 leading-relaxed">
                                            Keep the measuring tape comfortably loose. For the chest, measure around the fullest part. For the length, measure from the highest point of the shoulder down to the hem.
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
