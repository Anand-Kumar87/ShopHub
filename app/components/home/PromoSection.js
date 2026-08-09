'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function PromoSection() {
  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Banner 1 - Deep Minimalist */}
        <div className="relative bg-stone-900 text-white rounded-3xl p-8 md:p-12 overflow-hidden flex flex-col justify-center min-h-[320px] group">
          <div className="relative z-10 max-w-[65%] sm:max-w-[55%] transform transition-transform duration-500 group-hover:translate-x-2">
            <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 mb-3 uppercase">
              Students Get
            </p>
            <h3 className="text-4xl md:text-5xl font-light mb-4 tracking-tight">
              10% <span className="font-serif italic font-bold">OFF</span>
            </h3>
            <p className="text-sm text-stone-400 mb-8 font-light leading-relaxed">
              Verify your student status and save more on your everyday lifestyle essentials.
            </p>
            <Link
              href="/shop"
              className="inline-block bg-white text-stone-900 text-xs font-bold tracking-widest uppercase px-8 py-3.5 rounded-full hover:bg-stone-200 transition-colors shadow-lg"
            >
              Get Discount
            </Link>
          </div>

          {/* Faded Image on Right */}
          <div className="absolute right-0 top-0 bottom-0 w-[55%] md:w-[50%] opacity-80 group-hover:opacity-100 transition-opacity duration-700">
            <Image
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80"
              alt="Student Promo"
              fill
              className="object-cover object-left"
            />
            {/* Gradient mask to blend image into the solid background */}
            <div className="absolute inset-0 bg-gradient-to-r from-stone-900 via-stone-900/40 to-transparent"></div>
          </div>
        </div>

        {/* Banner 2 - Editorial Beige */}
        <div className="relative bg-[#E6DFD7] text-stone-900 rounded-3xl p-8 md:p-12 overflow-hidden flex flex-col justify-center min-h-[320px] group">
          <div className="relative z-10 max-w-[65%] sm:max-w-[55%] transform transition-transform duration-500 group-hover:translate-x-2">
            <p className="text-[10px] font-bold tracking-[0.2em] text-stone-500 mb-3 uppercase">
              New Season
            </p>
            <h3 className="text-4xl md:text-5xl font-light mb-4 tracking-tight">
              New <span className="font-serif italic font-bold">Look</span>
            </h3>
            <p className="text-sm text-stone-600 mb-8 font-light leading-relaxed">
              Discover the latest trends curated for you. Elevate your wardrobe today.
            </p>
            <Link
              href="/shop"
              className="inline-block bg-stone-900 text-white text-xs font-bold tracking-widest uppercase px-8 py-3.5 rounded-full hover:bg-stone-800 transition-colors shadow-lg"
            >
              Shop Now
            </Link>
          </div>

          {/* Zooming Image on Right */}
          <div className="absolute right-0 top-0 bottom-0 w-[55%] md:w-[50%] transition-transform duration-1000 group-hover:scale-105">
            <Image
              src="https://images.unsplash.com/photo-1485230405346-71acb9518d9c?auto=format&fit=crop&w=800&q=80"
              alt="New Season"
              fill
              className="object-cover object-left"
            />
            {/* Gradient mask to blend image into the solid background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#E6DFD7] via-[#E6DFD7]/50 to-transparent"></div>
          </div>
        </div>

      </div>
    </section>
  );
}