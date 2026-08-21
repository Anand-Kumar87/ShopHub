export default function Loading() {
    return (
        // 🔥 'fixed inset-0' हटाकर 'min-h-[70vh] w-full' लगा दिया ताकि Footer अपनी जगह (नीचे) रहे
        <div className="min-h-[70vh] w-full bg-white flex flex-col items-center justify-center animate-fade-in">
            <div className="flex flex-col items-center justify-center">
                {/* Premium Spinner */}
                <div className="w-12 h-12 border-2 border-stone-100 border-t-stone-900 rounded-full animate-spin mb-8 shadow-sm"></div>

                {/* Brand Name */}
                <h2 className="text-2xl font-extrabold text-stone-900 tracking-tighter flex items-baseline mb-2">
                    ShopHub<span className="text-stone-400 text-3xl leading-none">.</span>
                </h2>

                {/* Pulsing Text */}
                <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 animate-pulse">
                    Curating Experience...
                </p>
            </div>
        </div>
    );
}
