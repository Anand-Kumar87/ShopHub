'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiMonitor, FiSun, FiHeadphones, FiHome } from 'react-icons/fi';

// Curated Data arrays for luxury aesthetic
const MAIN_CATEGORIES = [
    {
        id: 1,
        name: 'Ready-to-Wear',
        desc: 'The defining pieces of the season, crafted for modern elegance.',
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
        slug: 'clothing'
    },
    {
        id: 2,
        name: 'Home & Living',
        desc: 'Curated aesthetics to elevate your personal space.',
        image: 'https://images.unsplash.com/photo-1618220179428-22790b46a0eb?auto=format&fit=crop&w=800&q=80',
        slug: 'home'
    },
    {
        id: 3,
        name: 'Tech & Audio',
        desc: 'Minimalist gadgets engineered for exceptional sound and utility.',
        image: 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&w=800&q=80',
        slug: 'electronics'
    },
    {
        id: 4,
        name: 'Apothecary',
        desc: 'Premium self-care, skincare, and signature fragrances.',
        image: 'https://images.unsplash.com/photo-1615397323640-198132e4d026?auto=format&fit=crop&w=800&q=80',
        slug: 'beauty'
    },
    {
        id: 5,
        name: 'Activewear',
        desc: 'Elevated movement essentials for an active lifestyle.',
        image: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=800&q=80',
        slug: 'sports'
    },
    {
        id: 6,
        name: 'The Library',
        desc: 'Exclusive art prints, design books, and media.',
        image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
        slug: 'books'
    }
];

const TRENDING_CATEGORIES = [
    { id: 1, name: 'Laptops & MacBooks', count: '128 Pieces', icon: FiMonitor, search: 'laptops' },
    { id: 2, name: 'Summer Edit', count: '95 Pieces', icon: FiSun, search: 'summer' },
    { id: 3, name: 'Acoustics', count: '76 Pieces', icon: FiHeadphones, search: 'audio' },
    { id: 4, name: 'Furniture', count: '112 Pieces', icon: FiHome, search: 'furniture' },
];

export default function CategoriesPage() {
    return (
        <main className="animate-fade-in bg-white min-h-screen pb-24">

            {/* Minimalist Editorial Header */}
            <div className="bg-stone-50 pt-24 pb-20 border-b border-stone-200 px-4 mb-16">
                <div className="max-w-3xl mx-auto text-center">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-4 block">
                        The Collections
                    </span>
                    <h1 className="text-4xl md:text-6xl font-light text-stone-900 tracking-tight">
                        Shop by <span className="font-serif italic font-bold">Category</span>
                    </h1>
                </div>
            </div>

            {/* Main Categories Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {MAIN_CATEGORIES.map((category) => (
                        <div key={category.id} className="group relative overflow-hidden rounded-2xl bg-stone-100">
                            {/* Premium 3:4 Aspect Ratio */}
                            <div className="aspect-[3/4] relative w-full h-full">
                                <Image
                                    src={category.image}
                                    alt={category.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
                                />
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>

                                {/* Content Reveal on Hover */}
                                <div className="absolute bottom-0 left-0 p-8 w-full flex flex-col items-start transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                                    <h3 className="text-2xl font-light text-white mb-2">{category.name}</h3>
                                    <p className="text-white/70 text-sm mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 leading-relaxed max-w-[90%]">
                                        {category.desc}
                                    </p>
                                    <Link
                                        href={`/shop?category=${category.slug}`}
                                        className="text-[10px] font-bold tracking-widest uppercase text-white border-b border-white pb-1 hover:text-stone-300 hover:border-stone-300 transition-colors"
                                    >
                                        Explore Collection
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Trending Categories Section */}
            <div className="border-t border-stone-200 pt-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-light text-stone-900">Trending <span className="font-serif italic font-bold">Now</span></h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                        {TRENDING_CATEGORIES.map((trend) => {
                            const IconComponent = trend.icon;
                            return (
                                <Link
                                    key={trend.id}
                                    href={`/shop?search=${trend.search}`}
                                    className="group flex flex-col items-center p-8 sm:p-10 rounded-2xl border border-stone-100 bg-white hover:bg-stone-900 hover:border-stone-900 transition-all duration-500 text-center"
                                >
                                    <div className="w-16 h-16 rounded-full bg-stone-50 flex items-center justify-center mb-6 group-hover:bg-stone-800 transition-colors duration-500">
                                        <IconComponent className="text-stone-900 group-hover:text-white transition-colors duration-500" size={24} strokeWidth={1} />
                                    </div>
                                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-stone-900 group-hover:text-white transition-colors duration-500 mb-2">
                                        {trend.name}
                                    </h3>
                                    <p className="text-xs text-stone-400 font-serif italic group-hover:text-stone-300 transition-colors duration-500">
                                        {trend.count}
                                    </p>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

        </main>
    );
}