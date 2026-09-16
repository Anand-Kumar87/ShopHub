'use client';

import { useEffect, useLayoutEffect } from 'react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function ProductLoading() {
    if (typeof window !== 'undefined' && window.scrollY > 0) {
        window.scrollTo(0, 0);
    }

    useIsomorphicLayoutEffect(() => {
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
    }, []);

    return (
        <div className="min-h-screen bg-stone-50 pt-24 pb-36 animate-fade-in">
            <div className="max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-12">
                {/* Breadcrumb Skeleton */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-200/50">
                    <div className="h-3 w-12 bg-stone-200 rounded animate-pulse"></div>
                    <div className="h-3 w-3 bg-stone-200 rounded animate-pulse"></div>
                    <div className="h-3 w-16 bg-stone-200 rounded animate-pulse"></div>
                    <div className="h-3 w-3 bg-stone-200 rounded animate-pulse"></div>
                    <div className="h-3 w-28 bg-stone-200 rounded animate-pulse"></div>
                    <div className="h-3 w-3 bg-stone-200 rounded animate-pulse"></div>
                    <div className="h-3 w-40 bg-stone-300 rounded animate-pulse"></div>
                </div>

                {/* Main Product Showcase Card Skeleton */}
                <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-xl shadow-stone-200/40 border border-stone-100 flex flex-col lg:flex-row overflow-hidden">
                    {/* Left Column: Image Skeleton */}
                    <div className="w-full lg:w-1/2 p-6 sm:p-10 bg-stone-50/40 border-b lg:border-b-0 lg:border-r border-stone-100">
                        <div className="w-full aspect-[4/5] max-h-[440px] bg-stone-200 rounded-3xl animate-pulse"></div>
                        <div className="flex gap-3 mt-4 overflow-hidden">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-16 h-20 sm:w-18 sm:h-22 rounded-xl bg-stone-200 animate-pulse flex-shrink-0"></div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Details & Actions Skeleton */}
                    <div className="w-full lg:w-1/2 p-5 sm:p-7 lg:p-8 flex flex-col justify-between space-y-4">
                        <div className="space-y-5">
                            <div className="flex justify-between items-center">
                                <div className="h-3 w-28 bg-stone-200 rounded animate-pulse"></div>
                                <div className="h-6 w-48 bg-stone-100 rounded-full animate-pulse"></div>
                            </div>
                            <div className="h-10 w-3/4 bg-stone-200 rounded-xl animate-pulse"></div>
                            <div className="h-20 w-full bg-stone-100 rounded-2xl animate-pulse"></div>

                            {/* Color Swatches Skeleton */}
                            <div className="space-y-2 pt-2">
                                <div className="h-3 w-20 bg-stone-200 rounded animate-pulse"></div>
                                <div className="flex gap-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full bg-stone-200 animate-pulse"></div>
                                    ))}
                                </div>
                            </div>

                            {/* Size Chips Skeleton */}
                            <div className="space-y-2 pt-2">
                                <div className="h-3 w-16 bg-stone-200 rounded animate-pulse"></div>
                                <div className="flex gap-2.5">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="w-14 h-10 rounded-xl bg-stone-200 animate-pulse"></div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* CTA Buttons Skeleton */}
                        <div className="pt-6 border-t border-stone-100">
                            <div className="flex items-center gap-3">
                                <div className="h-14 w-32 rounded-full bg-stone-100 animate-pulse"></div>
                                <div className="h-14 flex-1 rounded-full bg-stone-200 animate-pulse"></div>
                                <div className="h-14 flex-1 rounded-full bg-stone-900/40 animate-pulse"></div>
                                <div className="h-14 w-14 rounded-full bg-stone-100 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
