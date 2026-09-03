export default function ShopLoading() {
    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Page Header Skeleton */}
            <div className="bg-stone-50 pt-20 pb-16 border-b border-stone-200 flex flex-col items-center">
                <div className="h-4 w-32 bg-stone-200 rounded-full mb-4 animate-pulse"></div>
                <div className="h-14 w-64 md:w-96 bg-stone-200 rounded-2xl animate-pulse"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:flex lg:gap-12">
                {/* Sidebar Categories Skeleton */}
                <div className="hidden lg:block lg:w-1/4 space-y-12">
                    <div className="animate-pulse">
                        <div className="h-4 w-24 bg-stone-200 rounded-full mb-6"></div>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-3 w-full bg-stone-100 rounded-full"></div>
                            ))}
                        </div>
                    </div>
                    <div className="animate-pulse">
                        <div className="h-4 w-24 bg-stone-200 rounded-full mb-6 mt-12"></div>
                        <div className="flex gap-4">
                            <div className="h-10 w-full bg-stone-50 rounded-lg"></div>
                            <div className="h-10 w-full bg-stone-50 rounded-lg"></div>
                        </div>
                    </div>
                </div>

                {/* Products Grid Skeleton */}
                <div className="lg:w-3/4">
                    <div className="flex justify-between items-center mb-10 pb-4 border-b border-stone-100 animate-pulse">
                        <div className="h-8 w-40 bg-stone-100 rounded-full"></div>
                        <div className="h-6 w-32 bg-stone-50 rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-12 sm:gap-x-8">
                        {[1, 2, 3, 4, 5, 6].map(n => (
                            <div key={n} className="flex flex-col group animate-pulse">
                                {/* Image Placeholder */}
                                <div className="bg-stone-100 rounded-xl aspect-[3/4] w-full mb-5 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-stone-50/50"></div>
                                </div>
                                {/* Text Placeholders */}
                                <div className="h-4 w-3/4 bg-stone-100 rounded-full mb-3"></div>
                                <div className="h-3 w-1/3 bg-stone-100 rounded-full mb-3"></div>
                                {/* Colors Placeholder */}
                                <div className="flex gap-1.5">
                                    <div className="w-3.5 h-3.5 rounded-full bg-stone-100"></div>
                                    <div className="w-3.5 h-3.5 rounded-full bg-stone-100"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}