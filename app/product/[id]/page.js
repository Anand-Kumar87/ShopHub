'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FiShoppingBag, FiHeart, FiStar, FiTruck, FiMinus, FiPlus, FiChevronRight, FiRefreshCcw, FiX, FiMessageSquare } from 'react-icons/fi';
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

    // Fetching freeShippingThreshold & convertPrice from database via context
    const { convertPrice, freeShippingThreshold } = useGlobalCurrency() || { convertPrice: (v) => `₹${Number(v).toFixed(2)}`, freeShippingThreshold: 4999 };
    const { wishlistItems, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist() || { isInWishlist: () => false };

    // Component States
    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [activeTab, setActiveTab] = useState('details');

    // Review & Modal States
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

    // FETCH REAL DATA FROM SUPABASE
    useEffect(() => {
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
                    console.error('Error fetching product:', error);
                    toast.error("Piece not found in catalog.");
                    router.push('/shop');
                    return;
                }

                // Format arrays securely
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

            } catch (err) {
                console.error("Network Error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [productId, router]);

    // Handlers
    const increaseQuantity = () => setQuantity(prev => (product && prev < product.stock ? prev + 1 : prev));
    const decreaseQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

    const handleAddToCart = () => {
        if (!product) return;
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

    // REAL-TIME SUPABASE REVIEW SYSTEM
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

        try {
            const { error } = await supabase
                .from('products')
                .update({ reviews: updatedReviews, rating: newAverageRating })
                .eq('id', product.id);

            if (error) toast.error("Failed to sync review with server.");
            else toast.success("Thank you! Your review is now live.", { icon: '✨' });
        } catch (error) {
            toast.error("Network error while saving review.");
        }
    };

    if (isLoading || !product) {
        return (
            <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center animate-fade-in">
                <div className="w-10 h-10 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin mb-4"></div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400">Loading Masterpiece...</p>
            </div>
        );
    }

    return (
        <main className="bg-stone-50 min-h-screen pb-24 pt-24 animate-fade-in relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Premium Breadcrumb Navigation */}
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

                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-stone-200/40 overflow-hidden w-full border border-stone-100 flex flex-col lg:flex-row">

                    {/* Left: Image Gallery */}
                    <div className="w-full lg:w-1/2 p-6 sm:p-10 lg:p-12 bg-stone-50/30 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-stone-100">
                        <div className="relative w-full aspect-[4/5] max-h-[580px] bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200/60">
                            <Image
                                src={product.images[activeImageIdx]}
                                alt={product.name}
                                fill
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                className="object-cover transition-opacity duration-500"
                                priority
                            />
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

                    {/* Right: Content & Tabs */}
                    <div className="w-full lg:w-1/2 p-8 sm:p-10 lg:p-12 flex flex-col">

                        {/* Tabs Navigation */}
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

                        {/* DETAILS TAB */}
                        {activeTab === 'details' && (
                            <div className="flex-1 animate-fade-in flex flex-col">
                                <span className="text-stone-400 font-bold tracking-widest uppercase text-[10px] sm:text-xs mb-2 block">
                                    {product.category || 'Collection'}
                                </span>

                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-stone-900 mb-4 leading-tight">{product.name}</h1>

                                <div className="flex items-center gap-5 mb-6">
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
                                        <span>({product.reviews?.length || 0})</span>
                                    </div>
                                </div>

                                <p className="text-stone-500 leading-relaxed text-sm sm:text-base mb-10">{product.description}</p>

                                {/* 🔥 UPDATED: Color Selection (Changes Image on click) */}
                                {product.colors && product.colors.length > 0 && (
                                    <div className="mb-8">
                                        <h3 className="text-xs font-bold tracking-widest uppercase text-stone-900 mb-3.5">Color</h3>
                                        <div className="flex gap-3">
                                            {product.colors.map((color, idx) => (
                                                <button 
                                                    key={color} 
                                                    onClick={() => {
                                                        setSelectedColor(color);
                                                        // Change image based on color index if image exists
                                                        if (product.images && product.images.length > idx) {
                                                            setActiveImageIdx(idx);
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

                                {/* Size Selection */}
                                {product.sizes && product.sizes.length > 0 && (
                                    <div className="mb-8">
                                        <div className="flex justify-between items-center mb-3.5">
                                            <h3 className="text-xs font-bold tracking-widest uppercase text-stone-900">Size</h3>
                                            <button
                                                onClick={() => setIsSizeGuideOpen(true)}
                                                className="text-xs text-stone-500 font-medium underline cursor-pointer hover:text-stone-900 transition-colors"
                                            >
                                                Size Guide
                                            </button>
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

                                {/* Actions Row */}
                                <div className="flex flex-wrap sm:flex-nowrap gap-4 pt-8 mt-auto border-t border-stone-100 items-center">
                                    <div className="flex items-center justify-between w-32 h-14 bg-white border border-stone-200 rounded-full px-1.5 shadow-sm">
                                        <button onClick={decreaseQuantity} className="w-10 h-10 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors">
                                            <FiMinus size={16} />
                                        </button>
                                        <span className="font-bold text-base text-stone-900 select-none w-8 text-center">
                                            {quantity}
                                        </span>
                                        <button onClick={increaseQuantity} className="w-10 h-10 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors">
                                            <FiPlus size={16} />
                                        </button>
                                    </div>

                                    <MagneticButton className="flex-1 min-w-[180px]">
                                        <button onClick={handleAddToCart} className="w-full h-14 bg-stone-900 text-white rounded-full text-sm font-bold tracking-widest uppercase hover:bg-stone-800 transition-colors shadow-xl shadow-stone-900/20 flex items-center justify-center gap-2">
                                            <FiShoppingBag size={18} /> Add to Bag
                                        </button>
                                    </MagneticButton>

                                    <button
                                        onClick={handleWishlistToggle}
                                        className={`w-14 h-14 flex-shrink-0 border rounded-full flex items-center justify-center transition-all ${isWishlisted ? 'border-red-200 bg-red-50 text-red-500' : 'border-stone-200 text-stone-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50'}`}
                                        aria-label="Add to Wishlist"
                                    >
                                        <FiHeart size={22} className={isWishlisted ? 'fill-current' : ''} />
                                    </button>
                                </div>

                                {/* Dynamic Trust Badges */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 pt-8 mt-8 border-t border-stone-100">
                                    <div className="flex items-center gap-4 text-stone-600">
                                        <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center text-stone-900 border border-stone-100">
                                            <FiTruck size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-stone-900 leading-tight">Free Shipping</h4>
                                            {/* 🔥 UPDATED: Perfectly converting global currency for Shipping Threshold */}
                                            <p className="text-xs text-stone-500 mt-1">On orders over {convertPrice(freeShippingThreshold || 4999)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-stone-600">
                                        <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center text-stone-900 border border-stone-100">
                                            <FiRefreshCcw size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-stone-900 leading-tight">Easy Returns</h4>
                                            <p className="text-xs text-stone-500 mt-1">30-day return policy</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* REVIEWS TAB */}
                        {activeTab === 'reviews' && (
                            <div className="flex-1 flex flex-col animate-fade-in h-full">
                                <div className="flex-1 overflow-y-auto pr-3 space-y-6 mb-8 max-h-[450px] hide-scrollbar">
                                    {product.reviews?.length > 0 ? product.reviews.map((rev, i) => (
                                        <div key={i} className="border-b border-stone-100 pb-6">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="font-bold text-stone-900 block text-sm">{rev.user}</span>
                                                    <span className="text-xs text-stone-400 font-medium">{rev.date}</span>
                                                </div>
                                                <div className="flex text-yellow-400 text-sm">
                                                    {[...Array(5)].map((_, idx) => <FiStar key={idx} className={idx < rev.rating ? 'fill-current' : 'text-stone-200'} />)}
                                                </div>
                                            </div>
                                            <p className="text-sm text-stone-600 leading-relaxed mt-3">{rev.text}</p>
                                        </div>
                                    )) : (
                                        <div className="text-center py-12">
                                            <FiMessageSquare className="w-10 h-10 text-stone-200 mx-auto mb-4" />
                                            <p className="text-stone-500 text-sm">No reviews yet. Be the first to review!</p>
                                        </div>
                                    )}
                                </div>

                                {/* Write Review Form */}
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
                                        <textarea
                                            value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                                            placeholder="What did you like or dislike?" rows="3"
                                            className="w-full bg-white border border-stone-200 rounded-xl p-4 text-sm focus:outline-none focus:border-stone-900 mb-4 resize-none shadow-sm"
                                        ></textarea>
                                        <button type="submit" className="w-full bg-stone-900 text-white rounded-xl py-3.5 text-xs font-bold tracking-widest uppercase hover:bg-stone-800 transition-colors">
                                            Submit Review
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* 🔥 LUXURY SIZE GUIDE MODAL */}
            {isSizeGuideOpen && (
                <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-stone-100">
                        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                            <div>
                                <h3 className="text-xl font-light text-stone-900">Measurement <span className="font-serif italic font-bold">Guide</span></h3>
                            </div>
                            <button onClick={() => setIsSizeGuideOpen(false)} className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors">
                                <FiX size={18} />
                            </button>
                        </div>
                        <div className="p-8">
                            <p className="text-sm text-stone-600 mb-6">
                                Measurements are provided as a guide. Actual dimensions may vary slightly depending on style.
                            </p>
                            <div className="overflow-x-auto rounded-xl border border-stone-200">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="bg-stone-50">
                                        <tr>
                                            <th className="py-4 px-6 font-bold tracking-widest uppercase text-[10px] text-stone-900 border-b border-stone-200">Size</th>
                                            <th className="py-4 px-6 font-bold tracking-widest uppercase text-[10px] text-stone-900 border-b border-stone-200">Chest (In)</th>
                                            <th className="py-4 px-6 font-bold tracking-widest uppercase text-[10px] text-stone-900 border-b border-stone-200">Waist (In)</th>
                                            <th className="py-4 px-6 font-bold tracking-widest uppercase text-[10px] text-stone-900 border-b border-stone-200">Hip (In)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-stone-600">
                                        {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz, i) => (
                                            <tr key={sz} className={`${i !== 5 ? 'border-b border-stone-100' : ''} hover:bg-stone-50 transition-colors`}>
                                                <td className="py-4 px-6 font-bold text-stone-900">{sz}</td>
                                                <td className="py-4 px-6">{32 + (i * 3)} - {34 + (i * 3)}</td>
                                                <td className="py-4 px-6">{26 + (i * 3)} - {28 + (i * 3)}</td>
                                                <td className="py-4 px-6">{34 + (i * 3)} - {36 + (i * 3)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-8 flex justify-end">
                                <MagneticButton>
                                    <button onClick={() => setIsSizeGuideOpen(false)} className="px-8 py-3.5 bg-stone-900 text-white rounded-full hover:bg-stone-800 text-xs font-bold tracking-widest uppercase shadow-md transition-colors">
                                        Close Guide
                                    </button>
                                </MagneticButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
