'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase'; // 🔥 Real-time database added
import useSWR from 'swr'; // 🔥 SWR for Real-time stock updates
import { FiHeart, FiX, FiShoppingBag } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Contexts
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useGlobalCurrency } from '../context/CurrencyContext';

// 🔥 Fetch Live Stock for Real-time Updates
const fetchLiveStock = async () => {
    const { data, error } = await supabase.from('products').select('id, stock, status');
    if (error) return [];
    return data;
};

export default function WishlistPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    const { addToCart } = useCart();
    const { wishlistItems, removeFromWishlist } = useWishlist() || { wishlistItems: [], removeFromWishlist: () => { } };
    const { convertPrice } = useGlobalCurrency() || { convertPrice: (v) => `$${Number(v).toFixed(2)}` };

    // 🔥 SWR Hook to silently keep stock updated in Real-Time
    const { data: liveProducts } = useSWR('wishlist_live_stock', fetchLiveStock, {
        refreshInterval: 5000, // Checks for new stock every 5 seconds silently
        revalidateOnFocus: true
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleRemove = (e, id, name) => {
        if (e) e.stopPropagation();
        removeFromWishlist(id);
        toast.success(`${name} removed`, { icon: '💔', style: { background: '#f5f5f4', color: '#1c1917' } });
    };

    const handleMoveToBag = (e, item) => {
        if (e) e.stopPropagation();
        addToCart(item, 1);
        removeFromWishlist(item.id);
        toast.success(
            <div className="flex flex-col">
                <span className="font-bold text-sm">{item.name}</span>
                <span className="text-xs">Moved to your bag</span>
            </div>,
            { icon: '🛍️', style: { background: '#1c1917', color: '#fff' } }
        );
    };

    if (!mounted) {
        return (
            <main className="bg-white min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="animate-pulse">
                    <div className="h-8 bg-stone-100 w-48 mx-auto mb-16 rounded"></div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex flex-col">
                                <div className="bg-stone-100 aspect-[3/4] rounded-xl mb-4"></div>
                                <div className="bg-stone-100 h-3 rounded w-1/3 mb-2"></div>
                                <div className="bg-stone-100 h-4 rounded w-3/4 mb-4"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="bg-white min-h-screen pb-24 animate-fade-in">
            {/* Minimalist Editorial Header */}
            <div className="pt-24 pb-16 text-center border-b border-stone-100 mb-12">
                <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-3 block">Curated By You</span>
                <h1 className="text-4xl md:text-5xl font-light text-stone-900 tracking-tight">
                    My <span className="font-serif italic font-bold">Wishlist</span>
                </h1>
                <p className="text-stone-400 text-xs font-bold tracking-widest uppercase mt-6">
                    {wishlistItems.length} {wishlistItems.length === 1 ? 'Item' : 'Items'}
                </p>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {wishlistItems.length === 0 ? (
                    <div className="text-center py-16">
                        <FiHeart className="w-16 h-16 text-stone-200 mx-auto mb-6" strokeWidth={1} />
                        <h2 className="text-2xl font-light text-stone-900 mb-3">Your curation is empty</h2>
                        <p className="text-stone-500 mb-8 max-w-md mx-auto text-sm leading-relaxed">
                            Save your favorite pieces here to easily find them later or move them to your bag when you're ready.
                        </p>
                        <Link href="/shop" className="inline-block bg-stone-900 text-white text-xs font-bold tracking-widest uppercase px-10 py-4 rounded-full hover:bg-stone-800 transition-colors shadow-xl shadow-stone-900/10">
                            Discover Collections
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12 sm:gap-x-6">
                        {wishlistItems.map((item) => {
                            const itemImages = item.images || (item.image ? [item.image] : ['https://images.unsplash.com/photo-1434389670869-c87510fed58f?auto=format&fit=crop&w=600&q=80']);
                            
                            // 🔥 Dynamic Live Stock Calculation
                            const liveItem = liveProducts?.find(p => p.id === item.id);
                            const currentStock = liveItem ? liveItem.stock : item.stock;
                            const isOutOfStock = currentStock <= 0 || liveItem?.status === 'archived';

                            return (
                                <div
                                    key={item.id}
                                    className="group flex flex-col relative cursor-pointer"
                                    onClick={() => router.push(`/product/${item.id}`)}
                                >
                                    <div className="relative aspect-[3/4] bg-stone-100 rounded-xl overflow-hidden mb-4 border border-stone-100/50">
                                        <Image
                                            src={itemImages[0].startsWith('data:') ? itemImages[0] : `${itemImages[0]}?auto=format&fit=crop&w=600&q=80`}
                                            alt={item.name}
                                            fill
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                            className={`object-cover transition-transform duration-700 ease-out ${isOutOfStock ? 'grayscale opacity-70' : 'group-hover:scale-105'}`}
                                        />

                                        {/* 🔥 OUT OF STOCK BADGE */}
                                        {isOutOfStock && (
                                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 text-stone-900 text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-full shadow-lg z-20 whitespace-nowrap">
                                                Sold Out
                                            </span>
                                        )}

                                        <button
                                            onClick={(e) => handleRemove(e, item.id, item.name)}
                                            className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-white shadow-sm transition-colors z-30 lg:opacity-0 lg:group-hover:opacity-100"
                                            aria-label="Remove item"
                                        >
                                            <FiX size={16} />
                                        </button>

                                        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full lg:group-hover:translate-y-0 transition-transform duration-300 ease-out hidden lg:block z-20">
                                            {isOutOfStock ? (
                                                <button disabled className="w-full bg-stone-200 text-stone-400 text-sm font-bold py-3.5 rounded-lg cursor-not-allowed flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    Out of Stock
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => handleMoveToBag(e, item)}
                                                    className="w-full bg-white/90 backdrop-blur-md text-stone-900 text-sm font-bold py-3.5 rounded-lg shadow-lg hover:bg-stone-900 hover:text-white transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <FiShoppingBag size={16} /> Move to Bag
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col flex-grow px-1">
                                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">{item.category || 'Collection'}</span>
                                        <h3 className={`text-sm font-bold line-clamp-1 mb-1.5 transition-colors ${isOutOfStock ? 'text-stone-400' : 'text-stone-900 group-hover:text-stone-600'}`}>{item.name}</h3>
                                        <p className={`text-sm font-bold mb-4 ${isOutOfStock ? 'text-stone-400' : 'text-stone-900'}`}>
                                            {convertPrice(item.salePrice || item.price)}
                                            {item.oldPrice && <span className={`text-xs line-through ml-2 font-normal ${isOutOfStock ? 'text-stone-300' : 'text-stone-400'}`}>{convertPrice(item.oldPrice)}</span>}
                                        </p>

                                        <div className="mt-auto lg:hidden">
                                            {isOutOfStock ? (
                                                <button disabled className="w-full bg-stone-100 text-stone-400 text-[10px] font-bold tracking-widest uppercase py-3 rounded-full cursor-not-allowed" onClick={(e) => e.stopPropagation()}>
                                                    Out of Stock
                                                </button>
                                            ) : (
                                                <button onClick={(e) => handleMoveToBag(e, item)} className="w-full bg-stone-900 text-white text-[10px] font-bold tracking-widest uppercase py-3 rounded-full hover:bg-stone-800 transition-colors">
                                                    Move to Bag
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
