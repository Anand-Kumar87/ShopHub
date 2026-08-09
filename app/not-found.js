import Link from 'next/link';
import { FiHome, FiShoppingBag } from 'react-icons/fi';

export const metadata = {
    title: '404 - Page Not Found | ShopHub',
};

export default function NotFound() {
    return (
        <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 animate-fade-in py-16 relative overflow-hidden">
            {/* Background Luxury Decorative Element */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-stone-200/40 rounded-full blur-3xl -z-10 pointer-events-none"></div>

            <div className="max-w-2xl w-full text-center space-y-8 relative z-10">

                {/* Animated & Stylish 404 Text */}
                <div className="relative">
                    <h1 className="text-8xl md:text-[150px] font-light text-stone-900 tracking-tighter select-none">
                        404<span className="text-stone-300">.</span>
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-stone-900 text-white text-[10px] font-bold px-5 py-2 rounded-full uppercase tracking-widest shadow-xl transform -rotate-12 border-2 border-white">
                            Page Not Found
                        </div>
                    </div>
                </div>

                {/* Premium Editorial Message */}
                <div className="space-y-4">
                    <h2 className="text-3xl md:text-4xl font-serif italic font-bold text-stone-800">
                        Lost in the Collection?
                    </h2>
                    <p className="text-stone-500 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                        The piece you are looking for might have been removed, had its name changed, or is temporarily unavailable. Let's get you back.
                    </p>
                </div>

                {/* Sleek Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-stone-900 text-xs font-bold tracking-widest uppercase py-3.5 px-8 rounded-full transition-all shadow-sm"
                    >
                        <FiHome size={16} /> Homepage
                    </Link>
                    <Link
                        href="/shop"
                        className="flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold tracking-widest uppercase py-3.5 px-8 rounded-full transition-all shadow-xl shadow-stone-900/10"
                    >
                        <FiShoppingBag size={16} /> Keep Shopping
                    </Link>
                </div>

                {/* Minimalist Quick Links Section */}
                <div className="pt-12 mt-12 border-t border-stone-200/60">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-6">
                        Or Explore Our Collections
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {['Traditional', 'Modern', 'Bridal', 'Accessories'].map((cat) => (
                            <Link
                                key={cat}
                                href={`/shop?category=${cat.toLowerCase()}`}
                                className="text-stone-500 hover:text-stone-900 hover:bg-stone-100 text-xs font-bold tracking-widest uppercase px-5 py-2.5 rounded-full border border-transparent hover:border-stone-200 transition-all"
                            >
                                {cat}
                            </Link>
                        ))}
                    </div>
                </div>

            </div>
        </main>
    );
}