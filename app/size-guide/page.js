import { FiMinimize2 } from 'react-icons/fi';

export const metadata = {
    title: 'Size Guide | ShopHub',
};

export default function SizeGuidePage() {
    return (
        <main className="bg-white min-h-screen animate-fade-in pb-24">

            {/* Minimalist Editorial Header */}
            <div className="bg-stone-50 pt-24 pb-20 border-b border-stone-200 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-4 block">
                        Fit & Sizing
                    </span>
                    <h1 className="text-4xl md:text-6xl font-light text-stone-900 tracking-tight mb-6">
                        Size <span className="font-serif italic font-bold">Guide</span>
                    </h1>
                    <p className="text-stone-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                        Use our measurement charts below to find your perfect fit. If you are between sizes, we recommend opting for the larger size for a more relaxed drape.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">

                {/* Men's Clothing Table */}
                <section className="mb-20">
                    <h2 className="text-2xl font-light text-stone-900 mb-8">Men's Ready-to-Wear</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b-2 border-stone-900">
                                    <th className="py-4 pr-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Size</th>
                                    <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Chest (in)</th>
                                    <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Waist (in)</th>
                                    <th className="py-4 pl-4 font-bold tracking-widest uppercase text-[10px] text-stone-400 text-right">Neck (in)</th>
                                </tr>
                            </thead>
                            <tbody className="text-stone-600">
                                <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                                    <td className="py-5 pr-4 font-medium text-stone-900">S <span className="text-stone-400 font-normal text-xs ml-1">(Small)</span></td>
                                    <td className="py-5 px-4">34 - 36</td>
                                    <td className="py-5 px-4">28 - 30</td>
                                    <td className="py-5 pl-4 text-right">14 - 14.5</td>
                                </tr>
                                <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                                    <td className="py-5 pr-4 font-medium text-stone-900">M <span className="text-stone-400 font-normal text-xs ml-1">(Medium)</span></td>
                                    <td className="py-5 px-4">38 - 40</td>
                                    <td className="py-5 px-4">32 - 34</td>
                                    <td className="py-5 pl-4 text-right">15 - 15.5</td>
                                </tr>
                                <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                                    <td className="py-5 pr-4 font-medium text-stone-900">L <span className="text-stone-400 font-normal text-xs ml-1">(Large)</span></td>
                                    <td className="py-5 px-4">42 - 44</td>
                                    <td className="py-5 px-4">36 - 38</td>
                                    <td className="py-5 pl-4 text-right">16 - 16.5</td>
                                </tr>
                                <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                                    <td className="py-5 pr-4 font-medium text-stone-900">XL <span className="text-stone-400 font-normal text-xs ml-1">(Extra Large)</span></td>
                                    <td className="py-5 px-4">46 - 48</td>
                                    <td className="py-5 px-4">40 - 42</td>
                                    <td className="py-5 pl-4 text-right">17 - 17.5</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Women's Clothing Table */}
                <section className="mb-20">
                    <h2 className="text-2xl font-light text-stone-900 mb-8">Women's Ready-to-Wear</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b-2 border-stone-900">
                                    <th className="py-4 pr-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">US Size</th>
                                    <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Bust (in)</th>
                                    <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Waist (in)</th>
                                    <th className="py-4 pl-4 font-bold tracking-widest uppercase text-[10px] text-stone-400 text-right">Hips (in)</th>
                                </tr>
                            </thead>
                            <tbody className="text-stone-600">
                                <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                                    <td className="py-5 pr-4 font-medium text-stone-900">XS <span className="text-stone-400 font-normal text-xs ml-1">(0-2)</span></td>
                                    <td className="py-5 px-4">32 - 33</td>
                                    <td className="py-5 px-4">24 - 25</td>
                                    <td className="py-5 pl-4 text-right">34.5 - 35.5</td>
                                </tr>
                                <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                                    <td className="py-5 pr-4 font-medium text-stone-900">S <span className="text-stone-400 font-normal text-xs ml-1">(4-6)</span></td>
                                    <td className="py-5 px-4">34 - 35</td>
                                    <td className="py-5 px-4">26 - 27</td>
                                    <td className="py-5 pl-4 text-right">36.5 - 37.5</td>
                                </tr>
                                <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                                    <td className="py-5 pr-4 font-medium text-stone-900">M <span className="text-stone-400 font-normal text-xs ml-1">(8-10)</span></td>
                                    <td className="py-5 px-4">36 - 37</td>
                                    <td className="py-5 px-4">28 - 29</td>
                                    <td className="py-5 pl-4 text-right">38.5 - 39.5</td>
                                </tr>
                                <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                                    <td className="py-5 pr-4 font-medium text-stone-900">L <span className="text-stone-400 font-normal text-xs ml-1">(12-14)</span></td>
                                    <td className="py-5 px-4">38.5 - 40</td>
                                    <td className="py-5 px-4">30.5 - 32</td>
                                    <td className="py-5 pl-4 text-right">41 - 42.5</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* How to Measure Section */}
                <section className="bg-stone-50 p-8 md:p-12 rounded-3xl border border-stone-100">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-stone-900 shadow-sm">
                            <FiMinimize2 size={20} />
                        </div>
                        <h2 className="text-2xl font-light text-stone-900">How to Measure</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="relative">
                            <span className="text-sm font-bold text-stone-300 tracking-widest block mb-2">01</span>
                            <h3 className="text-xs font-bold tracking-widest uppercase text-stone-900 mb-2">Bust / Chest</h3>
                            <p className="text-sm text-stone-500 leading-relaxed">
                                Measure under your arms, around the fullest part of your chest, keeping the measuring tape horizontal.
                            </p>
                        </div>
                        <div className="relative">
                            <span className="text-sm font-bold text-stone-300 tracking-widest block mb-2">02</span>
                            <h3 className="text-xs font-bold tracking-widest uppercase text-stone-900 mb-2">Natural Waist</h3>
                            <p className="text-sm text-stone-500 leading-relaxed">
                                Measure around your natural waistline, the narrowest part of your torso, keeping the tape a bit loose.
                            </p>
                        </div>
                        <div className="relative">
                            <span className="text-sm font-bold text-stone-300 tracking-widest block mb-2">03</span>
                            <h3 className="text-xs font-bold tracking-widest uppercase text-stone-900 mb-2">Hips</h3>
                            <p className="text-sm text-stone-500 leading-relaxed">
                                Stand with your heels together and measure around the fullest part of your body at the top of your legs.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </main>
    );
}