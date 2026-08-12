'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiHeart, FiShoppingBag, FiStar, FiEye } from 'react-icons/fi';
import toast from 'react-hot-toast';

// 1. Contexts Import Karein
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
// 🔥 Global Currency Context Import kiya
import { useGlobalCurrency } from '../../context/CurrencyContext';

// 🔥 openQuickView prop add kiya taki Shop page se Modal open ho sake
export default function ProductCard({ product, openQuickView }) {
  // 2. Global State Hooks
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  // 🔥 Currency hook setup
  const { convertPrice } = useGlobalCurrency() || { convertPrice: (v) => `$${Number(v).toFixed(2)}` };

  const {
    id,
    name,
    price,
    image,
    rating,
    reviews,
    discount,
    isNew,
    category
  } = product;

  // Calculate discounted price
  const discountedPrice = discount ? price - (price * discount / 100) : price;

  // 3. Wishlist Check
  const isWishlisted = isInWishlist(id);

  // 4. Premium Add to Cart Handler
  const handleAddToCart = (e) => {
    e.preventDefault(); // Prevents navigating to product page
    e.stopPropagation();

    addToCart(product, 1);
    toast.success(
      <div className="flex flex-col">
        <span className="font-bold">{name}</span>
        <span className="text-sm">Added to your bag</span>
      </div>,
      { icon: '🛍️' }
    );
  };

  // 5. Premium Wishlist Toggle Handler
  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isWishlisted) {
      removeFromWishlist(id);
      toast.error('Removed from Wishlist', { icon: '💔' });
    } else {
      addToWishlist(product);
      toast.success('Saved to Wishlist!', {
        icon: '❤️',
        style: { background: '#fef2f2', color: '#991b1b' }
      });
    }
  };

  // 6. Quick View Handler
  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (openQuickView) {
        openQuickView(product); // Shop page ka modal function call karega
    } else {
        toast('Quick view coming soon...', { icon: '👀' });
    }
  };

  return (
    // 🔥 Pura card Link hai, ispe click se seedha Product Details page khulega
    <Link href={`/product/${id}`} className="group flex flex-col relative cursor-pointer block h-full">

      {/* Product Image Section (Premium 3:4 Aspect Ratio) */}
      <div className="relative aspect-[3/4] bg-stone-100 rounded-xl overflow-hidden mb-4 border border-stone-100/50">
        <Image
          src={image || "https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=800&auto=format&fit=crop"}
          alt={name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Minimalist Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {isNew && (
            <span className="bg-white/90 backdrop-blur-sm text-stone-900 text-[9px] font-bold px-3 py-1.5 rounded-full shadow-sm tracking-widest uppercase">
              New
            </span>
          )}
          {discount > 0 && (
            <span className="bg-red-600 text-white text-[9px] font-bold px-3 py-1.5 rounded-full shadow-sm tracking-widest uppercase">
              Sale
            </span>
          )}
        </div>

        {/* Top Right Actions (Wishlist & Quick View) */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          <button
            onClick={handleWishlist}
            className={`p-2.5 rounded-full transition-all duration-300 shadow-sm ${isWishlisted
                ? 'bg-red-50 text-red-500 opacity-100'
                : 'bg-white/90 backdrop-blur-sm text-stone-400 hover:text-red-500 lg:opacity-0 lg:group-hover:opacity-100'
              }`}
            aria-label="Wishlist"
          >
            <FiHeart size={16} className={isWishlisted ? 'fill-current' : ''} />
          </button>
          
          {/* 🔥 Desktop Quick View Button */}
          <button
            onClick={handleQuickView}
            className="p-2.5 bg-white/90 backdrop-blur-sm text-stone-400 hover:text-stone-900 rounded-full transition-all duration-300 shadow-sm lg:opacity-0 lg:group-hover:opacity-100 hidden lg:flex items-center justify-center"
            aria-label="Quick View"
          >
            <FiEye size={16} />
          </button>
        </div>

        {/* Quick Add Overlay (Glassmorphism Slide-up - Desktop) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full lg:group-hover:translate-y-0 transition-transform duration-300 ease-out hidden lg:block z-20">
          <button
            onClick={handleAddToCart}
            className="w-full bg-white/90 backdrop-blur-md text-stone-900 text-sm font-bold py-3.5 rounded-lg shadow-lg hover:bg-stone-900 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <FiShoppingBag size={16} /> Quick Add
          </button>
        </div>

        {/* Mobile Quick Actions (Visible only on small screens) */}
        <div className="absolute bottom-3 right-3 lg:hidden z-20 flex flex-col gap-2">
          {/* 🔥 Mobile Quick View Button */}
          <button
            onClick={handleQuickView}
            className="w-10 h-10 bg-white/90 backdrop-blur-md text-stone-900 flex items-center justify-center rounded-full shadow-md hover:bg-stone-900 hover:text-white transition-colors"
            aria-label="Quick view"
          >
            <FiEye size={18} />
          </button>
          
          <button
            onClick={handleAddToCart}
            className="w-10 h-10 bg-white/90 backdrop-blur-md text-stone-900 flex items-center justify-center rounded-full shadow-md hover:bg-stone-900 hover:text-white transition-colors"
            aria-label="Add to cart"
          >
            <FiShoppingBag size={18} />
          </button>
        </div>
      </div>

      {/* Product Info Section */}
      <div className="flex flex-col flex-grow px-1">
        {/* Category tag */}
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">
          {category || 'Collection'}
        </span>

        {/* Product Name */}
        <h3 className="text-sm font-bold text-stone-900 line-clamp-1 mb-1.5 group-hover:text-stone-600 transition-colors">
          {name}
        </h3>

        {/* Price & Rating Row */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            {/* 🔥 Automatic Currency Convertor */}
            <span className="text-sm font-bold text-stone-900">
              {convertPrice(discountedPrice)}
            </span>
            {discount > 0 && (
              <span className="text-xs font-medium text-stone-400 line-through">
                {convertPrice(price)}
              </span>
            )}
          </div>

          {/* Minimalist Rating */}
          <div className="flex items-center text-xs text-stone-500">
            <FiStar className="text-yellow-400 fill-current mr-1" size={12} />
            <span className="font-medium">{rating}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
