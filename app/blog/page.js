'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';

export default function BlogPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                // Tries to fetch from your real backend API
                const res = await fetch('/api/blog');
                if (res.ok) {
                    const data = await res.json();
                    setPosts(data);
                } else {
                    throw new Error('API endpoint not ready yet');
                }
            } catch (error) {
                console.warn("Using fallback data until real API is connected.");
                // Premium Mock Data for Editorial Aesthetic
                setPosts([
                    {
                        id: 1,
                        title: "The Art of Minimalist Living",
                        excerpt: "Discover how stripping away the excess can lead to a more curated, intentional, and beautiful daily experience.",
                        author: "Elena Rossi",
                        date: "Oct 12, 2023",
                        category: "Lifestyle",
                        image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80"
                    },
                    {
                        id: 2,
                        title: "Curating Your Autumn Wardrobe",
                        excerpt: "A comprehensive guide to transitioning your closet for the cooler months with timeless, transitional pieces.",
                        author: "Marcus Chen",
                        date: "Oct 05, 2023",
                        category: "Style",
                        image: "https://images.unsplash.com/photo-1434389678369-18342cb31a1b?auto=format&fit=crop&w=800&q=80"
                    },
                    {
                        id: 3,
                        title: "Sustainable Materials in Modern Design",
                        excerpt: "How contemporary creators are utilizing ethically sourced materials without compromising on luxury or durability.",
                        author: "Sarah Jenkins",
                        date: "Sep 28, 2023",
                        category: "Design",
                        image: "https://images.unsplash.com/photo-1618220179428-22790b46a0eb?auto=format&fit=crop&w=800&q=80"
                    },
                    {
                        id: 4,
                        title: "Elevating the Everyday: Desk Essentials",
                        excerpt: "Transform your workspace into a haven of productivity with these architecturally inspired objects.",
                        author: "David Kim",
                        date: "Sep 15, 2023",
                        category: "Curation",
                        image: "https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&w=800&q=80"
                    },
                    {
                        id: 5,
                        title: "The Return of Tailored Linen",
                        excerpt: "Exploring the resurgence of this breathable fabric in high-end, structured silhouettes this season.",
                        author: "Elena Rossi",
                        date: "Sep 02, 2023",
                        category: "Trends",
                        image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80"
                    },
                    {
                        id: 6,
                        title: "Architectural Influences in Footwear",
                        excerpt: "When structural design meets wearable art. A look at the new lines blurring buildings and boots.",
                        author: "Marcus Chen",
                        date: "Aug 21, 2023",
                        category: "Innovation",
                        image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80"
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    return (
        <main className="bg-white min-h-screen pb-24 animate-fade-in">

            {/* Minimalist Editorial Header */}
            <div className="bg-stone-50 pt-24 pb-20 border-b border-stone-200 px-4 mb-16">
                <div className="max-w-3xl mx-auto text-center">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-4 block">
                        Editorial
                    </span>
                    <h1 className="text-4xl md:text-6xl font-light text-stone-900 tracking-tight mb-6">
                        The <span className="font-serif italic font-bold">Journal</span>
                    </h1>
                    <p className="text-stone-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                        Stories, insights, and inspirations curated by our in-house experts and contributing editors.
                    </p>
                </div>
            </div>

            {/* Journal Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {loading ? (
                    /* Premium Skeleton Loader */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 animate-pulse">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex flex-col">
                                <div className="aspect-[4/5] bg-stone-100 mb-6 rounded-2xl"></div>
                                <div className="h-3 bg-stone-100 rounded w-1/4 mb-4"></div>
                                <div className="h-6 bg-stone-100 rounded w-3/4 mb-3"></div>
                                <div className="h-4 bg-stone-100 rounded w-full mb-2"></div>
                                <div className="h-4 bg-stone-100 rounded w-2/3 mb-6"></div>
                                <div className="h-3 bg-stone-100 rounded w-1/3"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Editorial Article Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                        {posts.map(post => (
                            <article key={post.id} className="group cursor-pointer flex flex-col">

                                {/* Featured Image with Zoom Hover */}
                                <Link href={`/blog/${post.id}`} className="block relative aspect-[4/5] overflow-hidden bg-stone-100 mb-6 rounded-2xl border border-stone-100">
                                    {post.image && (
                                        <Image
                                            src={post.image}
                                            alt={post.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 transition-colors duration-500"></div>
                                </Link>

                                {/* Article Metadata */}
                                <div className="flex items-center gap-3 text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-3">
                                    <span className="text-stone-900">{post.category || 'Editorial'}</span>
                                    <span className="w-1 h-1 rounded-full bg-stone-300"></span>
                                    <span>{post.date}</span>
                                </div>

                                {/* Article Title & Excerpt */}
                                <Link href={`/blog/${post.id}`} className="block flex-grow">
                                    <h2 className="text-2xl font-light text-stone-900 mb-3 group-hover:text-stone-600 transition-colors duration-300 line-clamp-2">
                                        {post.title}
                                    </h2>
                                    <p className="text-sm text-stone-500 leading-relaxed mb-6 line-clamp-3">
                                        {post.excerpt}
                                    </p>
                                </Link>

                                {/* Author & Read More */}
                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-stone-100">
                                    <div className="text-[10px] font-bold tracking-widest uppercase text-stone-900">
                                        By {post.author}
                                    </div>
                                    <Link
                                        href={`/blog/${post.id}`}
                                        className="text-stone-400 group-hover:text-stone-900 transition-colors duration-300 flex items-center gap-2 text-xs font-bold tracking-widest uppercase"
                                    >
                                        Read <FiArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform duration-300" />
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {/* Load More Button (Visual Only for now) */}
                {!loading && posts.length > 0 && (
                    <div className="mt-20 text-center">
                        <button className="inline-block bg-white text-stone-900 text-xs font-bold tracking-widest uppercase px-10 py-4 rounded-full border border-stone-200 hover:bg-stone-50 hover:border-stone-300 transition-all">
                            Load More Articles
                        </button>
                    </div>
                )}

            </div>
        </main>
    );
}