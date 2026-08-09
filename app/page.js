'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from './utils/supabase'; // 🔥 Real Database Connection
import {
  FiHeart, FiShoppingBag, FiTruck, FiRefreshCcw,
  FiShield, FiMapPin, FiArrowRight, FiX, FiStar,
  FiMinus, FiPlus, FiMessageSquare
} from 'react-icons/fi';
import { useCart } from './context/CartContext';
import { useWishlist } from './context/WishlistContext';
import toast from 'react-hot-toast';
import { useGlobalCurrency } from './context/CurrencyContext';

// 🔥 Magic button Import 
import MagneticButton from './components/MagneticButton';

export default function Home() {
  const { addToCart } = useCart();

  // 🔥 Real Wishlist & Currency Hooks
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist() || { isInWishlist: () => false };
  const { convertPrice } = useGlobalCurrency() || { convertPrice: (v) => `$${Number(v).toFixed(2)}` };

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  // 🔥 Added Loading State for Skeleton UI
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 🔥 Modal (Quick View) States
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  // Review Form States
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  // 🔥 NEW: Size Guide Modal State
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // 🔥 Fetch ONLY Real Data from Database (No Fake Products)
  useEffect(() => {
    const fetchHomeData = async () => {
      setIsLoadingData(true); // Start loading

      // 1. Fetch Real Products from Database
      const { data: dbProducts, error: prodError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!prodError && dbProducts && dbProducts.length > 0) {
        const activeProducts = dbProducts.filter(p => p.status !== 'archived' && p.status !== 'draft');
        setProducts(
          activeProducts.slice(0, 4).map(p => ({
            ...p,
            images: p.images || (p.image ? [p.image] : [])
          }))
        );
      } else {
        const localProducts = JSON.parse(localStorage.getItem('shophub_products')) || [];
        const activeProducts = localProducts.filter(p => p.status !== 'archived' && p.status !== 'draft');
        setProducts(activeProducts.slice(0, 4));
      }

      // 2. Fetch Real Categories from Database
      const { data: dbCategories, error: catError } = await supabase
        .from('categories')
        .select('*');

      if (!catError && dbCategories && dbCategories.length > 0) {
        setCategories(dbCategories);
      } else {
        const localCategories = JSON.parse(localStorage.getItem('shophub_categories')) || [];
        setCategories(localCategories);
      }

      setIsLoadingData(false); // End loading
    };

    fetchHomeData();
  }, []);

  // Reset modal states when a new product is selected
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

  // Action Handlers
  const handleAddToCart = (e, product, qty = 1) => {
    if (e) e.stopPropagation();
    const cartItem = { ...product };
    addToCart(cartItem, qty);
    toast.success(
      <div className="flex flex-col">
        <span className="font-bold">{product.name}</span>
        <span className="text-sm">Added to your bag ({qty}x)</span>
      </div>,
      { icon: '🛍️' }
    );
    setSelectedProduct(null);
  };

  const handleWishlistToggle = (e, product) => {
    if (e) e.stopPropagation();
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      toast.success(`${product.name} removed from wishlist`, { icon: '💔' });
    } else {
      addToWishlist(product);
      toast.success(`${product.name} saved to wishlist!`, { icon: '❤️', style: { background: '#fef2f2', color: '#991b1b' } });
    }
  };

  // 🔥 REAL-TIME SUPABASE REVIEW SYSTEM (Like Shop Page)
  const submitReview = async (e) => {
    e.preventDefault();

    if (reviewRating === 0) return toast.error("Please select a star rating first.");
    if (reviewText.trim().length < 5) return toast.error("Review must be at least 5 characters.");

    // 1. Get current logged-in user's name
    let reviewerName = 'Verified Buyer';
    try {
      const localUser = JSON.parse(localStorage.getItem('currentUser'));
      if (localUser && localUser.firstName) {
        reviewerName = `${localUser.firstName} ${localUser.lastName || ''}`.trim();
      }
    } catch (err) {
      console.warn("Could not fetch user name");
    }

    // 2. Create New Review Object
    const newReview = {
      user: reviewerName,
      rating: reviewRating,
      text: reviewText,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    const existingReviews = selectedProduct.reviews || [];
    const updatedReviews = [newReview, ...existingReviews];

    // 3. Calculate New Average Rating dynamically
    const totalRating = updatedReviews.reduce((sum, rev) => sum + rev.rating, 0);
    const newAverageRating = parseFloat((totalRating / updatedReviews.length).toFixed(1));

    const updatedProduct = {
      ...selectedProduct,
      reviews: updatedReviews,
      rating: newAverageRating
    };

    // 4. Update UI instantly (Optimistic Update for speed)
    setSelectedProduct(updatedProduct);
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));

    setReviewRating(0);
    setReviewText('');

    // 5. Save to Real Database (Supabase)
    try {
      const { error } = await supabase
        .from('products')
        .update({
          reviews: updatedReviews,
          rating: newAverageRating
        })
        .eq('id', selectedProduct.id);

      if (error) {
        console.error("Review DB Update Error:", error);
        toast.error("Failed to sync review with server. Please try again.");
      } else {
        toast.success("Thank you! Your review is now live.", { icon: '✨' });
      }
    } catch (error) {
      console.error("Network error:", error);
      toast.error("Network error while saving review.");
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 pb-20 animate-fade-in relative">

      {/* 1. HERO SECTION */}
      <section className="relative w-full h-[70vh] bg-stone-200 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1920&q=80"
          alt="Fashion Model"
          fill
          className="object-cover object-center opacity-90"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-100/90 via-stone-100/60 to-transparent"></div>

        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <div className="max-w-xl">
            <h1 className="text-5xl md:text-7xl font-light text-stone-900 mb-6 leading-tight tracking-tight">
              WEAR YOUR <br /><span className="font-serif italic font-bold">CONFIDENCE</span>
            </h1>
            <p className="text-lg text-stone-700 mb-8 max-w-md">
              Trendy pieces. Timeless style. Discover the collection you need to look and feel your best.
            </p>
            <div className="flex gap-4">
              <Link href="/shop" className="bg-stone-900 text-white px-8 py-3.5 rounded-full font-medium hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/20">
                SHOP NEW IN
              </Link>
              <Link href="/shop" className="bg-white text-stone-900 border border-stone-300 px-8 py-3.5 rounded-full font-medium hover:bg-stone-50 transition-colors">
                EXPLORE COLLECTIONS
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST BADGES */}
      <section className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div className="flex items-center justify-center md:justify-start gap-3 text-stone-700">
              <FiTruck className="text-xl" />
              <div>
                <p className="font-bold">FREE SHIPPING</p>
                <p className="text-xs text-stone-500">On eligible orders</p>
              </div>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-3 text-stone-700">
              <FiRefreshCcw className="text-xl" />
              <div>
                <p className="font-bold">EASY RETURNS</p>
                <p className="text-xs text-stone-500">30-day return policy</p>
              </div>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-3 text-stone-700">
              <FiShield className="text-xl" />
              <div>
                <p className="font-bold">SECURE PAYMENT</p>
                <p className="text-xs text-stone-500">100% secure checkout</p>
              </div>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-3 text-stone-700">
              <FiMapPin className="text-xl" />
              <div>
                <p className="font-bold">STORES NEAR YOU</p>
                <p className="text-xs text-stone-500">Find a ShopHub store</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SHOP BY CATEGORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-2xl font-bold text-stone-900 tracking-tight">SHOP BY CATEGORY</h2>
          <Link href="/shop" className="text-sm font-medium text-stone-500 hover:text-stone-900 flex items-center gap-1">
            View all <FiArrowRight />
          </Link>
        </div>

        {/* PREMIUM CATEGORY SKELETON LOADER */}
        {isLoadingData ? (
          <div className="flex overflow-x-auto hide-scrollbar gap-8 pb-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="flex flex-col items-center gap-3 min-w-[100px] animate-pulse">
                <div className="w-24 h-24 rounded-full bg-stone-200"></div>
                <div className="h-3 w-16 bg-stone-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="flex overflow-x-auto hide-scrollbar gap-8 pb-4">
            {categories.map((cat, index) => (
              <Link key={cat.id || index} href={`/shop?category=${cat.slug || cat.name.toLowerCase()}`} className="flex flex-col items-center gap-3 group min-w-[100px]">
                <div className="w-24 h-24 rounded-full overflow-hidden border border-stone-200 p-1 group-hover:border-stone-900 transition-colors duration-300">
                  <div className="w-full h-full rounded-full overflow-hidden relative flex items-center justify-center bg-stone-100">
                    {cat.image ? (
                      <Image
                        src={cat.image.startsWith('data:') ? cat.image : `${cat.image}?auto=format&fit=crop&w=200&q=80`}
                        alt={cat.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="96px"
                      />
                    ) : (
                      <>
                        <div className={`absolute inset-0 transition-transform duration-700 group-hover:scale-125 group-hover:rotate-6 ${[
                          'bg-gradient-to-tr from-stone-100 via-stone-50 to-stone-200',
                          'bg-gradient-to-bl from-rose-50 via-stone-50 to-orange-50',
                          'bg-gradient-to-tl from-slate-100 via-zinc-50 to-stone-100',
                          'bg-gradient-to-br from-amber-50 via-stone-50 to-stone-100',
                          'bg-gradient-to-t from-teal-50 via-slate-50 to-emerald-50'
                        ][index % 5]}`}></div>
                        <div className="absolute inset-0 bg-stone-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <span className="relative z-10 text-stone-800 font-serif italic font-bold text-xl uppercase tracking-widest group-hover:scale-110 transition-transform duration-500 drop-shadow-sm">
                          {cat.name.slice(0, 3)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-stone-800">{cat.name}</span>
              </Link>
            ))}
            <Link href="/shop?sale=true" className="flex flex-col items-center gap-3 group min-w-[100px]">
              <div className="w-24 h-24 rounded-full overflow-hidden border border-stone-900 bg-stone-900 flex items-center justify-center group-hover:bg-stone-800 transition-colors duration-300">
                <span className="text-white font-serif italic font-bold text-xl">SALE</span>
              </div>
              <span className="text-sm font-medium text-stone-800">Offers</span>
            </Link>
          </div>
        ) : (
          <div className="py-10 text-center bg-white rounded-3xl border border-stone-100">
            <p className="text-stone-500 text-sm">No collections created yet. Add collections from Admin Portal.</p>
          </div>
        )}
      </section>

      {/* 4. NEW ARRIVALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-stone-900 tracking-tight">NEW ARRIVALS</h2>
            <p className="text-stone-500 text-sm mt-1">Fresh styles. Just in.</p>
          </div>
          <Link href="/shop" className="text-sm font-medium text-stone-500 hover:text-stone-900 flex items-center gap-1">
            View all <FiArrowRight />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* PREMIUM PRODUCT SKELETON LOADER */}
          {isLoadingData ? (
            [1, 2, 3, 4].map((n) => (
              <div key={n} className="flex flex-col relative animate-pulse">
                <div className="relative aspect-[3/4] w-full bg-stone-200 rounded-xl mb-4"></div>
                <div className="h-3 w-3/4 bg-stone-200 rounded mb-2"></div>
                <div className="h-3 w-1/4 bg-stone-200 rounded"></div>
              </div>
            ))
          ) : products.length > 0 ? (
            products.map((product) => {
              const inWishlist = isInWishlist(product.id);
              return (
                <div
                  key={product.id}
                  className="group flex flex-col relative cursor-pointer"
                  onClick={() => { setSelectedProduct(product); setModalQuantity(1); }}
                >
                  <div className="relative aspect-[3/4] w-full bg-stone-100 rounded-xl overflow-hidden mb-4 block">
                    <div className="absolute inset-0 z-0">
                      <Image
                        src={product.images?.[0] || product.image || 'https://images.unsplash.com/photo-1434389670869-c87510fed58f?auto=format&fit=crop&w=600&q=80'}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>

                    <button
                      onClick={(e) => handleWishlistToggle(e, product)}
                      className={`absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm shadow-sm rounded-full transition-all z-10 ${inWishlist ? 'text-red-500' : 'text-stone-400 hover:text-red-500 hover:bg-white'}`}
                    >
                      <FiHeart className={inWishlist ? "fill-current" : ""} />
                    </button>

                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10">
                      <button
                        onClick={(e) => handleAddToCart(e, product, 1)}
                        className="w-full bg-white/95 backdrop-blur-md text-stone-900 font-bold py-3 rounded-lg shadow-lg hover:bg-stone-900 hover:text-white transition-colors flex items-center justify-center gap-2"
                      >
                        <FiShoppingBag /> Quick Add
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-start w-full">
                    <h3 className="text-sm font-bold text-stone-900 group-hover:text-stone-500 transition-colors line-clamp-1 w-full">
                      {product.name}
                    </h3>
                    <p className="text-sm text-stone-600 mt-1">
                      {convertPrice(product.salePrice || product.price)}
                      {product.oldPrice && <span className="text-xs text-stone-400 line-through ml-2">{convertPrice(product.oldPrice)}</span>}
                    </p>
                  </div>

                  {product.colors && product.colors.length > 0 && (
                    <div className="flex gap-1.5 mt-2">
                      {product.colors.map((color, i) => (
                        <div
                          key={i}
                          className="w-3.5 h-3.5 rounded-full border border-stone-200"
                          style={!color.startsWith('bg-') ? { backgroundColor: color } : {}}
                        ></div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-stone-100">
              <FiShoppingBag className="w-12 h-12 text-stone-200 mb-4" />
              <h3 className="text-xl font-light text-stone-900 mb-2">No Products Yet</h3>
              <p className="text-stone-500 text-sm mb-6 max-w-sm">Head over to the Admin Portal to add your first product to the catalog.</p>
              <Link href="/admin" className="bg-stone-900 text-white px-8 py-3 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-stone-800 transition-colors">
                Go to Admin
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 5. PROMO BANNERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative bg-stone-900 text-white rounded-2xl p-8 md:p-12 overflow-hidden flex flex-col justify-center min-h-[250px]">
            <div className="relative z-10 max-w-xs">
              <p className="text-xs font-bold tracking-widest text-stone-400 mb-2 uppercase">Students Get</p>
              <h3 className="text-4xl font-bold mb-3">10% OFF</h3>
              <p className="text-sm text-stone-300 mb-6">Verify your student status and save more.</p>
              <button onClick={() => toast('Redirecting to Student Portal...', { icon: '🎓' })} className="bg-white text-stone-900 text-sm font-bold px-6 py-2.5 rounded-full hover:bg-stone-200 transition-colors w-max">
                GET DISCOUNT
              </button>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-50 md:opacity-100">
              <Image src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=500&q=80" alt="Student Promo" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover object-left" />
            </div>
          </div>

          <div className="relative bg-[#D4C3B3] text-stone-900 rounded-2xl p-8 md:p-12 overflow-hidden flex flex-col justify-center min-h-[250px]">
            <div className="relative z-10 max-w-xs">
              <p className="text-xs font-bold tracking-widest text-stone-700 mb-2 uppercase">New Season</p>
              <h3 className="text-4xl font-serif italic mb-3">NEW LOOK</h3>
              <p className="text-sm text-stone-800 mb-6">Discover the latest trends curated for you.</p>
              <Link href="/shop" className="bg-stone-900 text-white text-sm font-bold px-6 py-2.5 rounded-full hover:bg-stone-800 transition-colors w-max">
                SHOP NOW
              </Link>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/2">
              <Image src="https://images.unsplash.com/photo-1485230405346-71acb9518d9c?auto=format&fit=crop&w=500&q=80" alt="New Season" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover object-left" />
            </div>
          </div>
        </div>
      </section>

      {/* QUICK VIEW MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-6xl relative flex flex-col md:flex-row max-h-[90vh]">

            <button onClick={() => setSelectedProduct(null)} className="absolute top-5 right-5 bg-stone-100 p-2.5 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-200 z-10 transition-colors">
              <FiX size={20} />
            </button>

            <div className="w-full md:w-1/2 p-6 md:p-8 bg-stone-50 flex flex-col">
              <div className="relative aspect-[4/5] bg-white rounded-2xl overflow-hidden mb-4 border border-stone-100 shadow-sm">
                <Image
                  src={selectedProduct.images?.[activeImageIdx]?.startsWith('data:') ? selectedProduct.images[activeImageIdx] : `${selectedProduct.images?.[activeImageIdx] || 'https://images.unsplash.com/photo-1434389670869-c87510fed58f?auto=format&fit=crop&w=600&q=80'}?auto=format&fit=crop&w=800&q=80`}
                  alt={selectedProduct.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              {selectedProduct.images?.length > 1 && (
                <div className="flex gap-3 overflow-x-auto hide-scrollbar">
                  {selectedProduct.images.map((img, idx) => (
                    <button key={idx} onClick={() => setActiveImageIdx(idx)} className={`relative w-20 h-24 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImageIdx === idx ? 'border-stone-900' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                      <Image
                        src={img?.startsWith('data:') ? img : `${img}?auto=format&fit=crop&w=200&q=80`}
                        alt="thumbnail"
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
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
                  <h2 className="text-3xl font-light text-stone-900 mb-3">
                    {selectedProduct.name}
                  </h2>
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
                        {selectedProduct.colors.map((color, idx) => (
                          <button key={idx} onClick={() => setSelectedColor(color)} className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${selectedColor === color ? 'border-stone-900 scale-110' : 'border-transparent hover:scale-110 shadow-sm'}`}>
                            <span
                              className="w-6 h-6 rounded-full border border-stone-200 block"
                              style={!color.startsWith('bg-') ? { backgroundColor: color } : {}}
                            ></span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold tracking-widest uppercase text-stone-900">Size</span>
                        {/* 🔥 FIX: Changed button to open Size Guide Modal */}
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
                    {/* 🔥 Magnetic Button Integration */}
                    <MagneticButton className="flex-1">
                      <button
                        onClick={(e) => handleAddToCart(e, { ...selectedProduct, color: selectedColor, size: selectedSize }, modalQuantity)}
                        className="w-full bg-stone-900 text-white rounded-full text-sm font-bold tracking-widest uppercase hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/20 py-3.5"
                      >
                        Add to Bag
                      </button>
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

      {/* 🔥 LUXURY SIZE GUIDE MODAL */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-stone-100">

            {/* Header */}
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

            {/* Body - Size Chart */}
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