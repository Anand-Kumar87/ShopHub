'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowRight } from 'react-icons/fi';
import useSWR from 'swr';
import { supabase } from '../utils/supabase';

// 🔥 5 PREMIUM FALLBACK IMAGES (अब हर खाली केटेगरी में अलग इमेज दिखेगी)
const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&w=800&q=80', // Tech/Acoustics
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',  // Activewear
    'https://images.unsplash.com/photo-1667312939978-64cf31718a6e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Home Decor
    'https://images.unsplash.com/photo-1608979048467-6194dabc6a3d?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Beauty/Apothecary
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80' // Fashion
];

const fetchCategories = async () => {
    const { data, error } = await supabase
        .from('categories')
        .select('*');

    if (error) {
        console.error("Error fetching categories:", error);
        throw new Error("Failed to load categories");
    }
    return data || [];
};

export default function CategoriesPage() {
    const { data: categories, error, isLoading: isSwrLoading } = useSWR(
        'live-categories',
        fetchCategories,
        {
            revalidateOnFocus: true,
            refreshInterval: 10000,
        }
    );

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, []);

    if (!isMounted || isSwrLoading) {
        return (
            <div className="min-h-[70vh] w-full bg-white flex flex-col items-center justify-center animate-fade-in">
                <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-2 border-stone-100 border-t-stone-900 rounded-full animate-spin mb-8 shadow-sm"></div>
                    <h2 className="text-2xl font-extrabold text-stone-900 tracking-tighter flex items-baseline mb-2">
                        ShopHub<span className="text-stone-400 text-3xl leading-none">.</span>
                    </h2>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 animate-pulse">
                        Curating Collections...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <p className="text-stone-500 font-bold tracking-widest uppercase text-sm">Failed to load collections.</p>
            </div>
        );
    }

    const trendingCategories = categories?.slice(0, 4) || [];

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .stagger-item {
                    animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                    opacity: 0;
                }
            `}} />

            <main className="bg-white min-h-screen pb-24 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-stone-50/50 backdrop-blur-3xl -z-10 rounded-b-[100px]"></div>

                <div className="pt-32 pb-20 px-4 mb-8 stagger-item" style={{ animationDelay: '0.1s' }}>
                    <div className="max-w-3xl mx-auto text-center">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-6 block">
                            The Collections
                        </span>
                        <h1 className="text-4xl md:text-6xl font-light text-stone-900 tracking-tight leading-tight">
                            Shop by <span className="font-serif italic font-bold">Category</span>
                        </h1>
                        <p className="mt-6 text-sm text-stone-500 max-w-lg mx-auto leading-relaxed">
                            Explore our meticulously curated sections. Everything you need, sorted for the modern aesthetic.
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
                    {categories?.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-stone-200 rounded-3xl">
                            <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">No categories found in database.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                            {categories.map((category, index) => {
                                // 🔥 LOGIC: Choose a unique fallback image based on index
                                const imageUrl = category.image && category.image !== 'EMPTY'
                                    ? category.image
                                    : FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];

                                return (
                                    <Link
                                        href={`/shop?category=${category.slug}`}
                                        key={category.id}
                                        className="group relative overflow-hidden rounded-[2rem] bg-stone-100 block stagger-item shadow-sm hover:shadow-2xl hover:shadow-stone-900/20 transition-all duration-700"
                                        style={{ animationDelay: `${0.2 + (index * 0.1)}s` }}
                                    >
                                        <div className="aspect-[3/4] relative w-full h-full overflow-hidden">
                                            <Image
                                                src={imageUrl}
                                                alt={category.name}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-700"></div>

                                            <div className="absolute bottom-0 left-0 p-8 sm:p-10 w-full flex flex-col items-start transform translate-y-4 group-hover:translate-y-0 transition-transform duration-700 ease-out">
                                                <h3 className="text-2xl sm:text-3xl font-light text-white mb-3 tracking-wide">{category.name}</h3>
                                                <p className="text-white/70 text-sm mb-8 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100 leading-relaxed max-w-[90%] transform translate-y-4 group-hover:translate-y-0">
                                                    {category.description || 'Explore the defining pieces of the season, crafted for modern elegance.'}
                                                </p>
                                                <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white border-b border-transparent group-hover:border-white pb-1 transition-all duration-500">
                                                    Explore Collection <FiArrowRight className="transform group-hover:translate-x-1 transition-transform duration-300" size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {trendingCategories.length > 0 && (
                    <div className="border-t border-stone-100 pt-24 stagger-item" style={{ animationDelay: '0.6s' }}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl font-light text-stone-900">Trending <span className="font-serif italic font-bold">Now</span></h2>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                                {trendingCategories.map((trend, index) => {
                                    const trendImageUrl = trend.image && trend.image !== 'EMPTY'
                                        ? trend.image
                                        : FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];

                                    return (
                                        <Link
                                            key={trend.id}
                                            href={`/shop?category=${trend.slug}`}
                                            className="group flex flex-col items-center p-8 sm:p-10 rounded-3xl border border-stone-100 bg-stone-50/50 hover:bg-stone-900 hover:border-stone-900 transition-all duration-500 text-center stagger-item shadow-sm hover:shadow-xl"
                                            style={{ animationDelay: `${0.7 + (index * 0.1)}s` }}
                                        >
                                            <div className="relative w-20 h-20 rounded-full overflow-hidden mb-6 border-[3px] border-white shadow-md group-hover:border-stone-700 transition-colors duration-500">
                                                <Image
                                                    src={trendImageUrl}
                                                    alt={trend.name}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                            </div>
                                            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-stone-900 group-hover:text-white transition-colors duration-500 mb-2">
                                                {trend.name}
                                            </h3>
                                            <p className="text-[10px] text-stone-400 font-serif italic group-hover:text-stone-300 transition-colors duration-500 flex items-center gap-1">
                                                Discover <FiArrowRight size={10} />
                                            </p>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
