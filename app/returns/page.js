import Link from 'next/link';
import { FiRotateCcw, FiTag, FiCreditCard } from 'react-icons/fi';

export const metadata = {
    title: 'Returns & Exchanges | ShopHub',
};

export default function ReturnsPage() {
    return (
        <main className="bg-white min-h-screen animate-fade-in pb-24">

            {/* Minimalist Editorial Header */}
            <div className="bg-stone-50 pt-24 pb-20 border-b border-stone-200 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-4 block">
                        Customer Care
                    </span>
                    <h1 className="text-4xl md:text-6xl font-light text-stone-900 tracking-tight mb-6">
                        Returns & <span className="font-serif italic font-bold">Exchanges</span>
                    </h1>
                    <p className="text-stone-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                        We want you to love your purchase. If you're not completely satisfied, we've made our return process as seamless and elegant as our products.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">

                {/* Policy Highlights Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 border-b border-stone-100 pb-16 mb-16">
                    <div className="text-center group">
                        <div className="w-14 h-14 mx-auto rounded-full bg-stone-50 flex items-center justify-center mb-5 group-hover:bg-stone-900 group-hover:text-white transition-colors duration-300 text-stone-900">
                            <FiRotateCcw size={20} />
                        </div>
                        <h3 className="text-xs font-bold tracking-widest uppercase text-stone-900 mb-2">30-Day Window</h3>
                        <p className="text-sm text-stone-500 leading-relaxed">Request a return within 30 days of your delivery date.</p>
                    </div>
                    <div className="text-center group">
                        <div className="w-14 h-14 mx-auto rounded-full bg-stone-50 flex items-center justify-center mb-5 group-hover:bg-stone-900 group-hover:text-white transition-colors duration-300 text-stone-900">
                            <FiTag size={20} />
                        </div>
                        <h3 className="text-xs font-bold tracking-widest uppercase text-stone-900 mb-2">Original Condition</h3>
                        <p className="text-sm text-stone-500 leading-relaxed">Items must be unworn, unwashed, with all original tags attached.</p>
                    </div>
                    <div className="text-center group">
                        <div className="w-14 h-14 mx-auto rounded-full bg-stone-50 flex items-center justify-center mb-5 group-hover:bg-stone-900 group-hover:text-white transition-colors duration-300 text-stone-900">
                            <FiCreditCard size={20} />
                        </div>
                        <h3 className="text-xs font-bold tracking-widest uppercase text-stone-900 mb-2">Fast Refunds</h3>
                        <p className="text-sm text-stone-500 leading-relaxed">Processed back to your original payment method within 5-7 days.</p>
                    </div>
                </div>

                {/* Return Steps */}
                <section className="mb-20">
                    <h2 className="text-2xl font-light text-stone-900 mb-8">How to initiate a return</h2>
                    <div className="space-y-6">
                        {[
                            { step: '01', title: 'Access Your Account', desc: 'Log in to your ShopHub account and navigate to your Order History.' },
                            { step: '02', title: 'Select Items', desc: 'Click "Return/Exchange" on the specific order and select the items you wish to send back.' },
                            { step: '03', title: 'Print Label', desc: 'Download and print the prepaid shipping label sent directly to your email.' },
                            { step: '04', title: 'Pack & Ship', desc: 'Securely pack the items in their original packaging and drop off at your nearest carrier location.' }
                        ].map((item, index) => (
                            <div key={index} className="flex gap-6 items-start p-6 bg-stone-50/50 rounded-2xl border border-stone-100 hover:border-stone-200 transition-colors">
                                <span className="text-sm font-bold text-stone-300 tracking-widest">{item.step}</span>
                                <div>
                                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest mb-2">{item.title}</h3>
                                    <p className="text-sm text-stone-600 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Exceptions */}
                <section className="mb-16">
                    <h2 className="text-2xl font-light text-stone-900 mb-6">Non-Returnable Items</h2>
                    <p className="text-sm text-stone-500 mb-6 leading-relaxed">
                        For hygiene, safety, and customization reasons, the following curated items cannot be returned or exchanged unless faulty:
                    </p>
                    <ul className="space-y-4 text-sm text-stone-600">
                        {[
                            'Intimate apparel and swimwear (if the hygiene seal is removed)',
                            'Beauty products, cosmetics, and pierced jewelry',
                            'Bespoke, customized, or personalized items',
                            'Gift cards and promotional vouchers'
                        ].map((item, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-2 flex-shrink-0"></span>
                                <span className="leading-relaxed">{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Contact CTA */}
                <div className="border-t border-stone-100 pt-16 text-center">
                    <h3 className="text-xl font-light text-stone-900 mb-3">Still have questions?</h3>
                    <p className="text-sm text-stone-500 mb-8 max-w-md mx-auto">
                        Our dedicated concierge team is available to assist you with any return or exchange inquiries.
                    </p>
                    <Link
                        href="/contact"
                        className="inline-block bg-stone-900 text-white text-xs font-bold tracking-widest uppercase px-10 py-4 rounded-full hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/10"
                    >
                        Contact Concierge
                    </Link>
                </div>

            </div>
        </main>
    );
}