'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';
import ProductCard from '../products/ProductCard'; // Ensure this path is correct

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulating network
        const mockProducts = [
          { id: 1, name: 'Wireless Noise Cancelling Headphones', price: 199.99, rating: 4.8, reviews: 124, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e', category: 'Electronics', isNew: true, discount: 0 },
          { id: 2, name: 'Premium Leather Wallet', price: 49.99, rating: 4.5, reviews: 89, image: 'https://images.unsplash.com/photo-1627123424574-724758594e93', category: 'Accessories', isNew: false, discount: 10 },
          { id: 3, name: 'Smart Watch Series 5', price: 299.99, rating: 4.7, reviews: 156, image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a', category: 'Electronics', isNew: true, discount: 15 },
          { id: 4, name: 'Cotton Casual T-Shirt', price: 24.99, rating: 4.3, reviews: 67, image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820', category: 'Clothing', isNew: false, discount: 0 },
        ];
        setProducts(mockProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white border-b border-stone-100">

      {/* Premium Editorial Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-3 block">
            Curated For You
          </span>
          <h2 className="text-3xl md:text-4xl font-light text-stone-900 tracking-tight">
            Featured <span className="font-serif italic font-bold">Pieces</span>
          </h2>
        </div>

        <Link
          href="/shop"
          className="group hidden sm:flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-stone-900 border-b border-stone-900 pb-1 hover:text-stone-500 hover:border-stone-500 transition-colors"
        >
          View All <FiArrowRight className="transform group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="animate-pulse flex flex-col">
              {/* Image Skeleton (Matches 3:4 aspect ratio of ProductCard) */}
              <div className="bg-stone-100 aspect-[3/4] rounded-xl mb-4"></div>
              {/* Text Skeletons */}
              <div className="bg-stone-100 h-2.5 rounded w-1/3 mb-2.5"></div>
              <div className="bg-stone-100 h-3.5 rounded w-3/4 mb-4"></div>
              <div className="flex justify-between">
                <div className="bg-stone-100 h-4 rounded w-1/4"></div>
                <div className="bg-stone-100 h-3 rounded w-1/5"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Mobile View All Button */}
      <div className="mt-12 text-center sm:hidden">
        <Link
          href="/shop"
          className="inline-block px-8 py-3.5 bg-stone-50 text-stone-900 text-xs font-bold tracking-widest uppercase rounded-full border border-stone-200 hover:bg-stone-900 hover:text-white transition-colors w-full"
        >
          Explore All Products
        </Link>
      </div>

    </section>
  );
}