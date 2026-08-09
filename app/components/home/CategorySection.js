'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiArrowRight } from 'react-icons/fi';

export default function CategorySection() {
  const categories = [
    { id: 1, name: 'Women', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=500&q=80', link: '/shop?category=women', count: 235 },
    { id: 2, name: 'Men', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=500&q=80', link: '/shop?category=men', count: 184 },
    { id: 3, name: 'Accessories', image: 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?auto=format&fit=crop&w=500&q=80', link: '/shop?category=accessories', count: 128 },
    { id: 4, name: 'Shoes', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=500&q=80', link: '/shop?category=shoes', count: 94 },
    { id: 5, name: 'Beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=500&q=80', link: '/shop?category=beauty', count: 112 },
    { id: 6, name: 'Home', image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=500&q=80', link: '/shop?category=home', count: 89 },
  ];

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-stone-100">

      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-3 block">
            Discover
          </span>
          <h2 className="text-3xl md:text-4xl font-light text-stone-900 tracking-tight">
            Shop by <span className="font-serif italic font-bold">Category</span>
          </h2>
        </div>

        <Link
          href="/categories"
          className="group flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-stone-900 border-b border-stone-900 pb-1 hover:text-stone-500 hover:border-stone-500 transition-colors"
        >
          View All <FiArrowRight className="transform group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Editorial Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-10 sm:gap-x-6">
        {categories.map((category) => (
          <Link key={category.id} href={category.link} className="group block">

            {/* Image Container */}
            <div className="relative overflow-hidden rounded-2xl bg-stone-100 aspect-[4/5] mb-4">
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              {/* Very subtle overlay for a premium matte finish */}
              <div className="absolute inset-0 bg-stone-900/5 group-hover:bg-transparent transition-colors duration-500"></div>
            </div>

            {/* Text Below Image */}
            <div className="flex flex-col items-center text-center">
              <h3 className="font-bold text-sm text-stone-900 uppercase tracking-wide group-hover:text-stone-600 transition-colors">
                {category.name}
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                {category.count} Items
              </p>
            </div>

          </Link>
        ))}
      </div>

      {/* Mobile View All Button */}
      <div className="mt-12 text-center sm:hidden">
        <Link
          href="/categories"
          className="inline-block px-8 py-3.5 bg-stone-50 text-stone-900 text-xs font-bold tracking-widest uppercase rounded-full border border-stone-200 hover:bg-stone-900 hover:text-white transition-colors w-full"
        >
          Explore All Categories
        </Link>
      </div>
    </section>
  );
}