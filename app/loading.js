export default function HomeLoading() {
    return (
        <div className="min-h-screen bg-stone-50 pb-20 overflow-hidden">
            {/* 1. Hero Section Skeleton */}
            <div className="w-full h-[70vh] bg-stone-200 animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 opacity-50"></div>
                <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
                    <div className="max-w-xl space-y-4">
                        <div className="h-16 w-3/4 bg-stone-300/50 rounded-xl"></div>
                        <div className="h-16 w-2/4 bg-stone-300/50 rounded-xl"></div>
                        <div className="h-4 w-full bg-stone-300/30 rounded-full mt-6"></div>
                        <div className="flex gap-4 mt-8">
                            <div className="h-12 w-40 bg-stone-300/40 rounded-full"></div>
                            <div className="h-12 w-48 bg-stone-300/30 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Trust Badges Skeleton */}
            <div className="border-b border-stone-200 bg-white py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-6 h-6 bg-stone-100 rounded-full"></div>
                            <div className="space-y-2">
                                <div className="h-3 w-24 bg-stone-100 rounded-full"></div>
                                <div className="h-2 w-16 bg-stone-50 rounded-full"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Categories Circular Skeleton */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="h-8 w-56 bg-stone-200 rounded-full mb-8 animate-pulse"></div>
                <div className="flex gap-8 overflow-hidden">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="flex flex-col items-center gap-3 animate-pulse">
                            <div className="w-24 h-24 rounded-full bg-stone-200"></div>
                            <div className="h-3 w-16 bg-stone-100 rounded-full"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
