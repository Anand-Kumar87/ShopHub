'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: 'THE SUMMER EDIT',
      subtitle: 'New Collection 2024',
      description: 'Discover our latest curation of premium essentials. Crafted for elegance, designed for the modern lifestyle.',
      buttonText: 'Explore Collection',
      buttonLink: '/shop?category=clothing',
      // Premium Fashion Shot
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop',
    },
    {
      id: 2,
      title: 'MINIMALIST LIVING',
      subtitle: 'Home & Lifestyle',
      description: 'Transform your personal space with our meticulously curated collection of modern décor and furniture.',
      buttonText: 'Shop Home',
      buttonLink: '/shop?category=home',
      // Premium Interior Shot
      image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=2000&auto=format&fit=crop',
    },
    {
      id: 3,
      title: 'MODERN CLASSICS',
      subtitle: 'The Accessories',
      description: 'Elevate your everyday look with timeless pieces. Where exceptional craftsmanship meets contemporary design.',
      buttonText: 'Discover Accessories',
      buttonLink: '/shop?category=accessories',
      // Premium Accessories Shot
      image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=2070&auto=format&fit=crop',
    },
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  // Auto-slide functionality
  useEffect(() => {
    const timer = setInterval(() => nextSlide(), 6000); // Slightly slower for a more luxurious feel
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative h-[75vh] md:h-[90vh] min-h-[600px] overflow-hidden group bg-stone-900">

      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
        >
          {/* Image with Subtle Matte Overlay */}
          <div className="absolute inset-0">
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={index === 0}
              className={`object-cover transition-transform duration-[10000ms] ease-linear ${index === currentSlide ? 'scale-105' : 'scale-100'}`}
            />
            <div className="absolute inset-0 bg-stone-900/30" />
          </div>

          {/* Text Content */}
          <div className="relative z-20 flex items-center h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`max-w-2xl text-left transition-all duration-1000 delay-300 transform ${index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>

              <span className="block text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-white/90 mb-6">
                {slide.subtitle}
              </span>

              <h2 className="text-5xl md:text-7xl lg:text-8xl font-light mb-6 text-white leading-[1.1] tracking-tighter">
                {slide.title.split(' ').map((word, i, arr) => (
                  <span key={i}>
                    {i === arr.length - 1 ? (
                      <span className="font-serif italic">{word}</span>
                    ) : (
                      word + ' '
                    )}
                  </span>
                ))}
              </h2>

              <p className="text-sm md:text-base mb-10 text-white/80 font-light max-w-md leading-relaxed">
                {slide.description}
              </p>

              <Link
                href={slide.buttonLink}
                className="inline-flex items-center justify-center px-10 py-4 text-xs font-bold tracking-widest uppercase text-stone-900 bg-white rounded-full hover:bg-stone-100 transition-colors duration-300 shadow-xl shadow-black/10"
              >
                {slide.buttonText}
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Minimalist Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 text-white/50 hover:text-white p-4 opacity-0 group-hover:opacity-100 transition-all duration-500"
        aria-label="Previous slide"
      >
        <FiChevronLeft size={40} strokeWidth={1} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 text-white/50 hover:text-white p-4 opacity-0 group-hover:opacity-100 transition-all duration-500"
        aria-label="Next slide"
      >
        <FiChevronRight size={40} strokeWidth={1} />
      </button>

      {/* Premium Progress Lines (Replacing Dots) */}
      <div className="absolute bottom-8 md:bottom-12 left-0 right-0 z-30 flex justify-center space-x-2 px-4">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className="group py-4 px-1 focus:outline-none"
            aria-label={`Go to slide ${index + 1}`}
          >
            <div
              className={`h-[2px] transition-all duration-500 ease-out ${index === currentSlide
                  ? 'w-12 bg-white'
                  : 'w-6 bg-white/40 group-hover:bg-white/70'
                }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}