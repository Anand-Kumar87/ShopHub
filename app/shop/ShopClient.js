'use client';

import { useState, useEffect, Suspense, useMemo, useDeferredValue } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import useSWR from 'swr'; // 🔥 Master Prompt P3: SWR वापस लाया गया है
import {
    FiHeart, FiShoppingBag, FiTruck, FiRefreshCcw,
    FiShield, FiMapPin, FiArrowRight, FiX, FiStar,
    FiMinus, FiPlus, FiMessageSquare, FiEye, FiFilter, FiGrid, FiList
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import { useCart } from '../context/CartContext';
import { useGlobalCurrency } from '../context/CurrencyContext';
import { useWishlist } from '../context/WishlistContext';
import { supabase } from '../utils/supabase';
import MagneticButton from '../components/MagneticButton';

// 🔥 SWR Fetchers (Background Sync) - Don't delete fetchCategories!
const fetchCategories = async () => {
    try {
        const { data } = await supabase.from('categories').select('*');
        return data && data.length > 0 ? [{ name: 'All Products', slug: 'all' }, ...data] : [{ name: 'All Products', slug: 'all' }];
    } catch (error) {
        return [{ name: 'All Products', slug: 'all' }];
    }
};

// Keep this in sync with the PRODUCT_COLUMNS constant in page.js so the
// server (SSR) fetch and this client fetch return identical product shapes.
const PRODUCT_COLUMNS = 'id,name,description,price,salePrice,oldPrice,category,images,image_url,colors,sizes,tags,rating,reviews,stock,status,onSale,created_at';

// 🔥 FIX: fetches the FULL catalog directly from Supabase instead of going
// through /api/products (which caps at 50 items) — so category filters,
// search, and pagination on this page always see every product, no matter
// how large the catalog grows.
const fetchProducts = async () => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select(PRODUCT_COLUMNS)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const activeProds = (data || []).filter(p => {
            const stat = (p.status || '').toLowerCase();
            return stat !== 'archived' && stat !== 'draft';
        });

        return activeProds.map(p => {
            let safeImages = ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'];
            if (Array.isArray(p.images) && p.images.length > 0) safeImages = p.images;
            else if (typeof p.images === 'string' && p.images.trim() !== '') safeImages = [p.images];
            else if (p.image) safeImages = [p.image];
            else if (p.image_url) safeImages = [p.image_url];

            return {
                ...p,
                colors: Array.isArray(p.colors) && p.colors.length ? p.colors : ['#000000', '#D1D5DB'],
                sizes: Array.isArray(p.sizes) && p.sizes.length ? p.sizes : ['One Size'],
                tags: Array.isArray(p.tags) && p.tags.length ? p.tags : (p.onSale ? ['Sale'] : ['New']),
                rating: p.rating || 5.0,
                reviews: p.reviews || [],
                images: safeImages
            };
        });
    } catch (error) {
        console.error('Client Fetch Error:', error);
        return [];
    }
};

function ShopContent({ initialCategories, initialProducts }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlSearchQuery = searchParams.get('search') || '';
    const urlCategoryQuery = searchParams.get('category') || 'all';

    const { addToCart } = useCart();
    const { convertPrice } = useGlobalCurrency() || { convertPrice: (v) => `₹${Number(v).toFixed(2)}` };

    // 🔥 Master Prompt P3: fallbackData का इस्तेमाल, ताकि 0 लोडिंग फ्लैश हो
    const { data: swrCategories } = useSWR('shop_categories', fetchCategories, {
        fallbackData: initialCategories,
        revalidateOnFocus: false
    });

    const { data: swrProducts } = useSWR('shop_products', fetchProducts, {
        fallbackData: initialProducts,
        revalidateOnFocus: false
    });

    const [allCategories, setAllCategories] = useState(initialCategories);
    const [allProducts, setAllProducts] = useState(initialProducts);

    // Sync Background SWR data to state for optimistic UI updates (Reviews)
    useEffect(() => {
        if (swrCategories) setAllCategories(swrCategories);
    }, [swrCategories]);

    useEffect(() => {
        if (swrProducts) setAllProducts(swrProducts);
    }, [swrProducts]);

    const [category, setCategory] = useState(urlCategoryQuery);
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(100000);
    const [sortBy, setSortBy] = useState('default');
    const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
    const [currentPage, setCurrentPage] = useState(1);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const itemsPerPage = viewMode === 'grid' ? 6 : 4;

    const { wishlistItems, addToWishlist, removeFromWishlist } = useWishlist() || { wishlistItems: [], addToWishlist: () => { }, removeFromWishlist: () => { } };

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [modalQuantity, setModalQuantity] = useState(1);
    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [activeTab, setActiveTab] = useState('details');
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

    const deferredSearchQuery = useDeferredValue(searchQuery);

    useEffect(() => {
        if (urlSearchQuery) setSearchQuery(urlSearchQuery);
        if (urlCategoryQuery) setCategory(urlCategoryQuery.toLowerCase());
    }, [urlSearchQuery, urlCategoryQuery]);

    useEffect(() => {
        if (selectedProduct) {
            setActiveImageIdx(0);
            setSelectedColor(selectedProduct.colors?.[0] || '');
            setSelectedSize(selectedProduct.sizes?.[0] || '');
            setActiveTab('details');
            setReviewRating(0);
            setReviewText('');
        }
    }, [selectedProduct]);

    const filteredProducts = useMemo(() => {
        let result = allProducts.filter(product => {
            const matchesCategory = category === 'all' || product.category?.toLowerCase() === category;
            const price = Number(product.price) || 0;
            const matchesPrice = price >= minPrice && price <= maxPrice;
            const matchesSearch = product.name.toLowerCase().includes(deferredSearchQuery.toLowerCase()) ||
                (product.description || '').toLowerCase().includes(deferredSearchQuery.toLowerCase());
            return matchesCategory && matchesPrice && matchesSearch;
        });

        if (sortBy === 'price-low') result.sort((a, b) => Number(a.price) - Number(b.price));
        if (sortBy === 'price-high') result.sort((a, b) => Number(b.price) - Number(a.price));
        if (sortBy === 'rating') result.sort((a, b) => b.rating - a.rating);
        if (sortBy === 'newest') result.sort((a, b) => new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0));

        return result;
    }, [allProducts, category, minPrice, maxPrice, deferredSearchQuery, sortBy]);

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleAddToCart = (product) => {
        addToCart(product, modalQuantity);
        toast.success(
            <div className="flex flex-col">
                <span className="font-bold">{product.name}</span>
                <span className="text-sm">Added to your bag ({modalQuantity}x)</span>
            </div>,
            { icon: '🛍️' }
        );
        setSelectedProduct(null);
    };

    const handleWishlist = (e, product) => {
        e.stopPropagation();
        const isAlreadyWishlisted = wishlistItems.some(item => item.id === product.id);

        if (isAlreadyWishlisted) {
            removeFromWishlist(product.id);
            toast.success(`${product.name} removed from wishlist!`, { icon: '💔' });
        } else {
            addToWishlist(product);
            toast.success(`${product.name} saved to wishlist!`, { icon: '❤️', style: { background: '#fef2f2', color: '#991b1b' } });
        }
    };

    const submitReview = async (e) => {
        e.preventDefault();

        if (reviewRating === 0) return toast.error("Please select a star rating first.");
        if (reviewText.trim().length < 5) return toast.error("Review must be at least 5 characters.");

        let reviewerName = 'Verified Buyer';
        try {
            const localUser = JSON.parse(localStorage.getItem('currentUser'));
            if (localUser && localUser.firstName) {
                reviewerName = `${localUser.firstName} ${localUser.lastName || ''}`.trim();
            }
        } catch (err) { }

        const newReview = {
            user: reviewerName,
            rating: reviewRating,
            text: reviewText,
            date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        };

        const existingReviews = selectedProduct.reviews || [];
        const updatedReviews = [newReview, ...existingReviews];
        const totalRating = updatedReviews.reduce((sum, rev) => sum + rev.rating, 0);
        const newAverageRating = parseFloat((totalRating / updatedReviews.length).toFixed(1));

        const updatedProduct = {
            ...selectedProduct,
            reviews: updatedReviews,
            rating: newAverageRating
        };

        setSelectedProduct(updatedProduct);
        setAllProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));

        setReviewRating(0);
        setReviewText('');

        try {
            const { error } = await supabase.from('products').update({ reviews: updatedReviews, rating: newAverageRating }).eq('id', selectedProduct.id);
            if (error) toast.error("Failed to sync review with server. Please try again.");
            else toast.success("Thank you! Your review is now live.", { icon: '✨' });
        } catch (error) {
            toast.error("Network error while saving review.");
        }
    };

    return (
        <main className="animate-fade-in bg-white min-h-screen pb-20">
            <div className="bg-stone-50 pt-20 pb-16 border-b border-stone-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
                    <span className="text-xs font-bold tracking-widest uppercase text-stone-400 mb-4">ShopHub Essentials</span>
                    <h1 className="text-4xl md:text-6xl font-light text-stone-900 mb-6 tracking-tight">
                        THE <span className="font-serif italic font-bold">COLLECTION</span>
                    </h1>
                    <p className="text-sm md:text-base text-stone-500 max-w-xl">
                        Discover our meticulously curated selection of premium essentials. Designed for the modern lifestyle.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="lg:hidden flex justify-between items-center mb-6">
                    <button onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)} className="flex items-center gap-2 text-stone-900 font-medium px-5 py-2 border border-stone-200 rounded-full text-sm">
                        <FiFilter /> Filters
                    </button>
                    <div className="flex gap-2">
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-stone-100 text-stone-900' : 'text-stone-400'}`}><FiGrid size={20} /></button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-stone-100 text-stone-900' : 'text-stone-400'}`}><FiList size={20} /></button>
                    </div>
                </div>

                <div className="lg:flex lg:gap-12">
                    <div className={`lg:w-1/4 ${isMobileFilterOpen ? 'block' : 'hidden'} lg:block mb-8 lg:mb-0`}>
                        <div className="sticky top-32 space-y-12 pr-6">
                            <div>
                                <h3 className="text-xs font-bold tracking-widest uppercase text-stone-900 mb-6">Categories</h3>
                                <ul className="space-y-4 text-sm font-medium">
                                    {allCategories.map(cat => (
                                        <li key={cat.slug}>
                                            <button
                                                onClick={() => { setCategory(cat.slug); setCurrentPage(1); setIsMobileFilterOpen(false); }}
                                                className={`transition-all capitalize flex items-center justify-between w-full group ${category === cat.slug ? 'text-stone-900' : 'text-stone-500 hover:text-stone-900'}`}
                                            >
                                                {cat.name}
                                                {category === cat.slug && <span className="w-1.5 h-1.5 bg-stone-900 rounded-full"></span>}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold tracking-widest uppercase text-stone-900 mb-6">Price Range</h3>
                                <div className="flex items-center gap-4">
                                    <div className="relative w-full">
                                        <input type="number" value={minPrice} onChange={(e) => setMinPrice(Number(e.target.value))} className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-stone-900 transition-colors" placeholder="Min" />
                                    </div>
                                    <span className="text-stone-300">-</span>
                                    <div className="relative w-full">
                                        <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-stone-900 transition-colors" placeholder="Max" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-3/4">
                        <div className="hidden lg:flex items-center justify-between mb-10 pb-4 border-b border-stone-100">
                            <h2 className="text-2xl font-light text-stone-900">
                                {searchQuery ? `Results for "${searchQuery}"` : (category !== 'all' ? <span className="capitalize">{allCategories.find(c => c.slug === category)?.name || category}</span> : 'All Products')}
                            </h2>

                            <div className="flex items-center gap-6 text-sm">
                                <span className="text-stone-400">{filteredProducts.length} items</span>

                                <div className="flex items-center gap-2">
                                    <span className="text-stone-400 font-medium">Sort:</span>
                                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-stone-900 font-bold focus:outline-none cursor-pointer">
                                        <option value="default">Featured</option>
                                        <option value="price-low">Price: Low - High</option>
                                        <option value="price-high">Price: High - Low</option>
                                        <option value="rating">Top Rated</option>
                                        <option value="newest">Newest First</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-1 border-l border-stone-200 pl-6">
                                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'text-stone-900 bg-stone-100' : 'text-stone-400 hover:text-stone-600'}`}><FiGrid size={18} /></button>
                                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'text-stone-900 bg-stone-100' : 'text-stone-400 hover:text-stone-600'}`}><FiList size={18} /></button>
                                </div>
                            </div>
                        </div>

                        {allProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 text-center bg-stone-50 rounded-2xl border border-stone-100">
                                <h3 className="text-2xl font-bold text-stone-900 mb-2">We're Updating Our Collection!</h3>
                                <p className="text-stone-500 max-w-sm mb-6 text-sm">Awesome new pieces are dropping soon. Please check back later.</p>
                                <Link href="/" className="bg-stone-900 text-white px-8 py-3 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-stone-800 transition-colors">
                                    Back to Home
                                </Link>
                            </div>
                        ) : paginatedProducts.length > 0 ? (
                            <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-12 sm:gap-x-8" : "flex flex-col gap-8"}>
                                {paginatedProducts.map((product, index) => {
                                    const isWishlisted = wishlistItems.some(item => item.id === product.id);
                                    const isOutOfStock = product.stock <= 0;

                                    return (
                                        <div
                                            key={product.id}
                                            className={`group cursor-pointer flex ${viewMode === 'list' ? 'flex-row gap-8 items-center border-b border-stone-100 pb-8' : 'flex-col relative'}`}
                                            onClick={() => router.push(`/product/${product.id}`)}
                                        >
                                            <div className={`relative bg-stone-100 rounded-xl overflow-hidden ${viewMode === 'list' ? 'w-1/3 aspect-square' : 'aspect-[3/4] mb-5'}`}>
                                                <Image
                                                    src={product.images[0]?.startsWith('data:') ? product.images[0] : `${product.images[0]}?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80`}
                                                    alt={product.name}
                                                    fill
                                                    priority={index < 4}
                                                    sizes="(max-width: 768px) 100vw, 33vw"
                                                    className={`object-cover transition-opacity duration-700 opacity-100 group-hover:opacity-0 ${isOutOfStock ? 'grayscale opacity-70' : ''}`}
                                                />
                                                {product.images[1] && (
                                                    <Image
                                                        src={product.images[1]?.startsWith('data:') ? product.images[1] : `${product.images[1]}?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80`}
                                                        alt={product.name}
                                                        fill
                                                        sizes="(max-width: 768px) 100vw, 33vw"
                                                        className={`object-cover transition-opacity duration-700 opacity-0 group-hover:opacity-100 absolute inset-0 ${isOutOfStock ? 'grayscale opacity-70' : ''}`}
                                                    />
                                                )}

                                                {isOutOfStock && (
                                                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 text-stone-900 text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-full shadow-lg z-20 whitespace-nowrap">
                                                        Sold Out
                                                    </span>
                                                )}

                                                <div className="absolute top-3 left-3 flex flex-col gap-2">
                                                    {product.oldPrice && product.onSale !== false && <span className="bg-red-600 text-white text-[9px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full shadow-md">Sale</span>}
                                                    {product.tags && product.tags.map(tag => (
                                                        <span key={tag} className="bg-white/90 backdrop-blur text-stone-900 text-[9px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full shadow-sm">{tag}</span>
                                                    ))}
                                                </div>

                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleWishlist(e, product); }}
                                                    className={`absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full transition-all ${isWishlisted ? 'text-red-500 opacity-100' : 'text-stone-400 hover:text-red-500'} ${viewMode === 'grid' && !isWishlisted ? 'opacity-0 group-hover:opacity-100' : ''}`}
                                                >
                                                    <FiHeart size={16} className={isWishlisted ? 'fill-current' : ''} />
                                                </button>

                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); setModalQuantity(1); }}
                                                    className={`absolute top-12 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-stone-400 hover:text-stone-900 hover:bg-white transition-all duration-300 z-10 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0`}
                                                >
                                                    <FiEye size={16} />
                                                </button>
                                            </div>

                                            <div className={viewMode === 'list' ? 'w-2/3 pr-4' : ''}>
                                                <h3 className={`font-bold transition-colors mb-1 ${viewMode === 'list' ? 'text-2xl mb-3' : 'text-sm truncate'} ${isOutOfStock ? 'text-stone-400' : 'text-stone-900 group-hover:text-stone-500'}`}>{product.name}</h3>

                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className={`${viewMode === 'list' ? 'text-xl' : 'text-sm'} font-medium ${isOutOfStock ? 'text-stone-400' : 'text-stone-600'}`}>
                                                        {convertPrice(product.salePrice || product.price)}
                                                    </span>
                                                    {product.oldPrice && (
                                                        <span className={`text-xs line-through ${isOutOfStock ? 'text-stone-300' : 'text-stone-400'}`}>
                                                            {convertPrice(product.oldPrice)}
                                                        </span>
                                                    )}
                                                </div>

                                                {product.colors && product.colors.length > 0 && !isOutOfStock && (
                                                    <div className="flex gap-1.5 mb-2">
                                                        {product.colors.map((color, i) => (
                                                            <div key={i} className="w-3.5 h-3.5 rounded-full border border-stone-200" style={{ backgroundColor: color }}></div>
                                                        ))}
                                                    </div>
                                                )}

                                                {viewMode === 'list' && (
                                                    <p className="text-stone-500 text-sm mt-4 mb-6 max-w-lg leading-relaxed">{product.description}</p>
                                                )}

                                                {viewMode === 'list' && (
                                                    <MagneticButton>
                                                        {isOutOfStock ? (
                                                            <button disabled className="px-8 py-3 bg-stone-200 text-stone-400 rounded-full text-sm font-bold tracking-widest uppercase cursor-not-allowed w-max" onClick={(e) => e.stopPropagation()}>
                                                                Out of Stock
                                                            </button>
                                                        ) : (
                                                            <button onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }} className="px-8 py-3 bg-stone-900 text-white rounded-full text-sm font-bold tracking-widest uppercase hover:bg-stone-800 transition-colors w-max">
                                                                Quick Add
                                                            </button>
                                                        )}
                                                    </MagneticButton>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-32 text-center bg-stone-50 rounded-2xl border border-stone-100">
                                <FiFilter className="w-12 h-12 text-stone-300 mb-4" />
                                <h3 className="text-xl font-bold text-stone-900 mb-2">No products found</h3>
                                <p className="text-stone-500 max-w-sm mb-6">We couldn't find anything matching your current filters.</p>
                                <button onClick={() => { setCategory('all'); setMinPrice(0); setMaxPrice(100000); setSearchQuery(''); }} className="bg-white px-6 py-3 border border-stone-200 rounded-full text-sm font-bold tracking-widest uppercase hover:border-stone-900 transition-colors">
                                    Clear all filters
                                </button>
                            </div>
                        )}

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-16 pt-8 border-t border-stone-100">
                                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-900 disabled:opacity-30 transition-colors">Prev</button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${currentPage === i + 1 ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>
                                        {i + 1}
                                    </button>
                                ))}
                                <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-900 disabled:opacity-30 transition-colors">Next</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedProduct && (
                <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-6xl relative flex flex-col md:flex-row max-h-[90vh]">
                        <button onClick={() => setSelectedProduct(null)} className="absolute top-5 right-5 bg-stone-100 p-2.5 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-200 z-10 transition-colors">
                            <FiX size={20} />
                        </button>

                        <div className="w-full md:w-1/2 p-6 md:p-8 bg-stone-50 flex flex-col">
                            <div className="relative aspect-[4/5] bg-white rounded-2xl overflow-hidden mb-4 border border-stone-100 shadow-sm">
                                <Image
                                    src={selectedProduct.images[activeImageIdx]?.startsWith('data:') ? selectedProduct.images[activeImageIdx] : `${selectedProduct.images[activeImageIdx]}?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80`}
                                    alt={selectedProduct.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className="object-cover"
                                />
                            </div>
                            <div className="flex gap-3 overflow-x-auto hide-scrollbar">
                                {selectedProduct.images.map((img, idx) => (
                                    <button key={idx} onClick={() => setActiveImageIdx(idx)} className={`relative w-20 h-24 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImageIdx === idx ? 'border-stone-900' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                                        <Image
                                            src={img?.startsWith('data:') ? img : `${img}?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80`}
                                            alt="thumbnail"
                                            fill
                                            sizes="80px"
                                            className="object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col overflow-y-auto hide-scrollbar">
                            <div className="flex gap-8 border-b border-stone-200 mb-8">
                                <button onClick={() => setActiveTab('details')} className={`pb-3 text-sm font-bold tracking-widest uppercase transition-colors relative ${activeTab === 'details' ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}>
                                    Details
                                    {activeTab === 'details' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-stone-900"></span>}
                                </button>
                                <button onClick={() => setActiveTab('reviews')} className={`pb-3 text-sm font-bold tracking-widest uppercase transition-colors relative flex items-center gap-2 ${activeTab === 'reviews' ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}>
                                    Reviews <span className="bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full text-[10px]">{selectedProduct.reviews?.length || 0}</span>
                                    {activeTab === 'reviews' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-stone-900"></span>}
                                </button>
                            </div>

                            {activeTab === 'details' && (
                                <div className="flex-1 animate-fade-in">
                                    <h2 className="text-3xl font-light text-stone-900 mb-3">{selectedProduct.name}</h2>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="flex items-end gap-2">
                                            <span className="text-2xl font-bold text-stone-900">
                                                {convertPrice(selectedProduct.salePrice || selectedProduct.price)}
                                            </span>
                                            {selectedProduct.oldPrice && (
                                                <span className="text-sm text-stone-400 line-through mb-1">
                                                    {convertPrice(selectedProduct.oldPrice)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="h-4 w-px bg-stone-200"></div>
                                        <div className="flex items-center text-sm text-stone-500 cursor-pointer hover:text-stone-900" onClick={() => setActiveTab('reviews')}>
                                            <FiStar className="text-yellow-400 fill-current mr-1" />
                                            <span>{selectedProduct.rating || 5.0} Rating</span>
                                        </div>
                                    </div>

                                    <p className="text-stone-500 leading-relaxed text-sm mb-8">{selectedProduct.description}</p>

                                    {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                                        <div className="mb-6">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-xs font-bold tracking-widest uppercase text-stone-900">Color</span>
                                            </div>
                                            <div className="flex gap-3">
                                                {selectedProduct.colors.map(color => (
                                                    <button key={color} onClick={() => setSelectedColor(color)} className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${selectedColor === color ? 'border-stone-900 scale-110' : 'border-transparent hover:scale-110 shadow-sm'}`}>
                                                        <span className="w-6 h-6 rounded-full border border-stone-200 block" style={{ backgroundColor: color }}></span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                                        <div className="mb-8">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-xs font-bold tracking-widest uppercase text-stone-900">Size</span>
                                                <button
                                                    onClick={() => setIsSizeGuideOpen(true)}
                                                    className="text-xs text-stone-400 underline cursor-pointer hover:text-stone-900"
                                                >
                                                    Size Guide
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                {selectedProduct.sizes.map(size => (
                                                    <button key={size} onClick={() => setSelectedSize(size)} className={`px-5 py-2.5 rounded-lg border text-sm font-medium transition-all ${selectedSize === size ? 'border-stone-900 bg-stone-900 text-white shadow-md' : 'border-stone-200 text-stone-600 hover:border-stone-400'}`}>
                                                        {size}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-4 pt-4 mt-auto border-t border-stone-100">
                                        <div className="flex items-center w-32 border border-stone-200 rounded-full bg-stone-50">
                                            <button onClick={() => setModalQuantity(prev => Math.max(1, prev - 1))} className="p-3 text-stone-500 hover:text-stone-900"><FiMinus size={14} /></button>
                                            <input type="number" value={modalQuantity} readOnly className="w-full bg-transparent text-center text-sm font-bold focus:outline-none" />
                                            <button onClick={() => setModalQuantity(prev => prev + 1)} className="p-3 text-stone-500 hover:text-stone-900"><FiPlus size={14} /></button>
                                        </div>

                                        <MagneticButton className="flex-1">
                                            {(selectedProduct.stock <= 0 || selectedProduct.quantity <= 0) ? (
                                                <button disabled className="w-full bg-stone-200 text-stone-400 rounded-full text-sm font-bold tracking-widest uppercase cursor-not-allowed py-3.5">
                                                    Out of Stock
                                                </button>
                                            ) : (
                                                <button onClick={() => handleAddToCart(selectedProduct)} className="w-full bg-stone-900 text-white rounded-full text-sm font-bold tracking-widest uppercase hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/20 py-3.5">
                                                    Add to Bag
                                                </button>
                                            )}
                                        </MagneticButton>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div className="flex-1 flex flex-col animate-fade-in h-full">
                                    <div className="flex-1 overflow-y-auto pr-2 space-y-6 mb-6">
                                        {selectedProduct.reviews?.length > 0 ? selectedProduct.reviews.map((rev, i) => (
                                            <div key={i} className="border-b border-stone-100 pb-6">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="font-bold text-stone-900 block text-sm">{rev.user}</span>
                                                        <span className="text-xs text-stone-400">{rev.date}</span>
                                                    </div>
                                                    <div className="flex text-yellow-400 text-sm">
                                                        {[...Array(5)].map((_, idx) => <FiStar key={idx} className={idx < rev.rating ? 'fill-current' : 'text-stone-200'} />)}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-stone-600 mt-2">{rev.text}</p>
                                            </div>
                                        )) : (
                                            <div className="text-center py-10">
                                                <FiMessageSquare className="w-10 h-10 text-stone-200 mx-auto mb-3" />
                                                <p className="text-stone-500 text-sm">No reviews yet. Be the first to review!</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-stone-50 p-5 rounded-2xl border border-stone-100 mt-auto">
                                        <h4 className="text-sm font-bold text-stone-900 mb-3">Write a Review</h4>
                                        <form onSubmit={submitReview}>
                                            <div className="flex gap-1 mb-3">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button type="button" key={star} onClick={() => setReviewRating(star)} className="focus:outline-none">
                                                        <FiStar size={20} className={star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-300 hover:text-yellow-200 transition-colors'} />
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea
                                                value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                                                placeholder="What did you like or dislike?" rows="2"
                                                className="w-full bg-white border border-stone-200 rounded-xl p-3 text-sm focus:outline-none focus:border-stone-900 mb-3 resize-none"
                                            ></textarea>
                                            <button type="submit" className="w-full bg-stone-900 text-white rounded-xl py-2.5 text-xs font-bold tracking-widest uppercase hover:bg-stone-800 transition-colors">
                                                Submit Review
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}

            {isSizeGuideOpen && (
                <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-stone-100">
                        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                            <div>
                                <h3 className="text-xl font-light text-stone-900">Measurement <span className="font-serif italic font-bold">Guide</span></h3>
                                <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mt-1">Find your perfect fit</p>
                            </div>
                            <button
                                onClick={() => setIsSizeGuideOpen(false)}
                                className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors"
                            >
                                <FiX size={16} />
                            </button>
                        </div>

                        <div className="p-8">
                            <p className="text-sm text-stone-600 mb-6">
                                Measurements are provided as a guide. Please note that exact dimensions may vary slightly depending on the specific style and cut of the garment.
                            </p>

                            <div className="overflow-x-auto rounded-xl border border-stone-200">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="bg-stone-50">
                                        <tr>
                                            <th className="py-4 px-6 font-bold tracking-widest uppercase text-[10px] text-stone-900 border-b border-stone-200">Size</th>
                                            <th className="py-4 px-6 font-bold tracking-widest uppercase text-[10px] text-stone-900 border-b border-stone-200">Chest (Inches)</th>
                                            <th className="py-4 px-6 font-bold tracking-widest uppercase text-[10px] text-stone-900 border-b border-stone-200">Waist (Inches)</th>
                                            <th className="py-4 px-6 font-bold tracking-widest uppercase text-[10px] text-stone-900 border-b border-stone-200">Hip (Inches)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-stone-600">
                                        <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                                            <td className="py-4 px-6 font-bold text-stone-900">XS</td>
                                            <td className="py-4 px-6">32 - 34</td>
                                            <td className="py-4 px-6">26 - 28</td>
                                            <td className="py-4 px-6">34 - 36</td>
                                        </tr>
                                        <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                                            <td className="py-4 px-6 font-bold text-stone-900">S</td>
                                            <td className="py-4 px-6">35 - 37</td>
                                            <td className="py-4 px-6">29 - 31</td>
                                            <td className="py-4 px-6">37 - 39</td>
                                        </tr>
                                        <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                                            <td className="py-4 px-6 font-bold text-stone-900">M</td>
                                            <td className="py-4 px-6">38 - 40</td>
                                            <td className="py-4 px-6">32 - 34</td>
                                            <td className="py-4 px-6">40 - 42</td>
                                        </tr>
                                        <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                                            <td className="py-4 px-6 font-bold text-stone-900">L</td>
                                            <td className="py-4 px-6">41 - 43</td>
                                            <td className="py-4 px-6">35 - 37</td>
                                            <td className="py-4 px-6">43 - 45</td>
                                        </tr>
                                        <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                                            <td className="py-4 px-6 font-bold text-stone-900">XL</td>
                                            <td className="py-4 px-6">44 - 46</td>
                                            <td className="py-4 px-6">38 - 40</td>
                                            <td className="py-4 px-6">46 - 48</td>
                                        </tr>
                                        <tr className="hover:bg-stone-50 transition-colors">
                                            <td className="py-4 px-6 font-bold text-stone-900">XXL</td>
                                            <td className="py-4 px-6">47 - 49</td>
                                            <td className="py-4 px-6">41 - 43</td>
                                            <td className="py-4 px-6">49 - 51</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <MagneticButton>
                                    <button
                                        onClick={() => setIsSizeGuideOpen(false)}
                                        className="px-8 py-3.5 bg-stone-900 text-white rounded-full hover:bg-stone-800 text-xs font-bold tracking-widest uppercase shadow-lg shadow-stone-900/10 transition-colors"
                                    >
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

export default function ShopClient(props) {
    return (
        // 🔥 FIX: Suspense से "Loading Collection..." टेक्स्ट हटा दिया गया है ताकि फ्लैश न हो
        <Suspense fallback={<div className="min-h-screen bg-stone-50"></div>}>
            <ShopContent {...props} />
        </Suspense>
    );
}
