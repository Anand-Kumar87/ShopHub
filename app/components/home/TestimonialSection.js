'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiArrowLeft, FiArrowRight, FiStar } from 'react-icons/fi';

export default function TestimonialSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    { id: 1, name: 'Sarah Johnson', title: 'Verified Buyer', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', rating: 5, text: 'I am extremely satisfied with my purchase. The material quality exceeded my expectations, and the minimalist packaging was a beautiful touch.' },
    { id: 2, name: 'Michael Chen', title: 'Verified Buyer', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', rating: 5, text: 'The delivery was impeccably prompt, and the piece looks exactly as curated on the site. I appreciate the true attention to detail.' },
    { id: 3, name: 'Emily Rodriguez', title: 'Verified Buyer', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', rating: 5, text: 'A truly seamless experience. The aesthetic of the brand translates perfectly into their products. It has quickly become my go-to store.' },
    { id: 4, name: 'David Kim', title: 'Verified Buyer', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', rating: 4, text: 'Exceptional curation of products. The customer service was responsive and the shipping was much faster than anticipated. Highly recommended.' },
  ];

  const nextSlide = () => setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));

  useEffect(() => {
    const interval = setInterval(nextSlide, 6000); // Slightly slower for relaxed reading
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Always return 3 items to avoid Next.js Hydration errors, we will hide side items on mobile using CSS.
  const getVisibleTestimonials = () => {
    const prev = (currentIndex - 1 + testimonials.length) % testimonials.length;
    const next = (currentIndex + 1) % testimonials.length;
    return [testimonials[prev], testimonials[currentIndex], testimonials[next]];
  };

  const visibleTestimonials = getVisibleTestimonials();

  return (
    <section className="bg-stone-50 py-24 border-t border-stone-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Premium Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-16 gap-6">
          <div className="text-center sm:text-left">
            <span className="text-[10px] font-bold tracking-[0.2em] text-stone-400 mb-3 block uppercase">
              The Community
            </span>
            <h2 className="text-3xl md:text-4xl font-light text-stone-900 tracking-tight">
              Real <span className="font-serif italic font-bold">Stories</span>
            </h2>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={prevSlide}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-stone-200 text-stone-400 hover:text-stone-900 hover:border-stone-900 transition-all duration-300 shadow-sm"
              aria-label="Previous testimonial"
            >
              <FiArrowLeft size={20} strokeWidth={1.5} />
            </button>
            <button
              onClick={nextSlide}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-stone-200 text-stone-400 hover:text-stone-900 hover:border-stone-900 transition-all duration-300 shadow-sm"
              aria-label="Next testimonial"
            >
              <FiArrowRight size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Testimonial Cards (Premium 3D Carousel Effect) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {visibleTestimonials.map((testimonial, index) => {
            const isActive = index === 1; // The middle item is active

            return (
              <div
                key={`${testimonial.id}-${index}`}
                className={`
                  ${isActive ? 'block' : 'hidden md:block'} 
                  bg-white p-8 md:p-10 rounded-2xl transition-all duration-700 ease-out border border-stone-100
                  ${isActive
                    ? 'shadow-2xl shadow-stone-200/50 transform md:-translate-y-4 relative z-10 opacity-100'
                    : 'shadow-sm opacity-40 hover:opacity-100 scale-95 z-0'
                  }
                `}
              >
                {/* Minimalist Stars */}
                <div className="flex mb-8 space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      className={i < testimonial.rating ? 'fill-stone-900 text-stone-900' : 'text-stone-200'}
                      size={16}
                    />
                  ))}
                </div>

                <p className="text-stone-600 mb-10 text-sm md:text-base leading-relaxed h-28 overflow-hidden font-serif italic">
                  "{testimonial.text}"
                </p>

                <div className="flex items-center pt-6 border-t border-stone-100">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4 bg-stone-100">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs tracking-widest uppercase text-stone-900 mb-1">
                      {testimonial.name}
                    </h4>
                    <p className="text-xs text-stone-400">
                      {testimonial.title}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}