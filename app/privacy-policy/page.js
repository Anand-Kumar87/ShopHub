import Link from 'next/link';
import { FiLock } from 'react-icons/fi';

export const metadata = {
    title: 'Privacy Policy | ShopHub',
    description: 'Learn how ShopHub collects, uses, and protects your personal data.',
};

export default function PrivacyPolicyPage() {
    return (
        <main className="bg-white min-h-screen animate-fade-in pb-24">

            {/* Minimalist Editorial Header */}
            <div className="bg-stone-50 pt-24 pb-20 border-b border-stone-200 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-4 block">
                        Data Protection
                    </span>
                    <h1 className="text-4xl md:text-6xl font-light text-stone-900 tracking-tight mb-6">
                        Privacy <span className="font-serif italic font-bold">Policy</span>
                    </h1>
                    <p className="text-stone-500 text-sm md:text-base max-w-xl mx-auto tracking-widest uppercase">
                        Last Updated: {new Date().toLocaleDateString('en-GB')}
                    </p>
                </div>
            </div>

            {/* Typography-Driven Content Section */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
                <div className="space-y-16">

                    <section>
                        <div className="flex items-baseline gap-4 mb-4">
                            <span className="text-sm font-bold text-stone-300 tracking-widest">01</span>
                            <h2 className="text-xl font-light text-stone-900">Information We Collect</h2>
                        </div>
                        <div className="pl-9 space-y-4 text-sm text-stone-500 leading-relaxed">
                            <p>
                                We collect information that you provide directly to us when you create an account, curate your wishlist, make a purchase, subscribe to our newsletter, or contact our concierge team.
                            </p>
                            <p>
                                This data intricately helps us tailor your experience and may include your name, email address, shipping destination, and secure payment information.
                            </p>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-baseline gap-4 mb-4">
                            <span className="text-sm font-bold text-stone-300 tracking-widest">02</span>
                            <h2 className="text-xl font-light text-stone-900">How We Use Your Information</h2>
                        </div>
                        <div className="pl-9">
                            <p className="text-sm text-stone-500 leading-relaxed mb-4">
                                The information we collect is utilized to elevate your shopping experience. Specifically, we use it to:
                            </p>
                            <ul className="space-y-4 text-sm text-stone-500 leading-relaxed">
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-2 flex-shrink-0"></span>
                                    <span>Process, fulfill, and securely dispatch your orders.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-2 flex-shrink-0"></span>
                                    <span>Communicate seamlessly regarding your deliveries, exclusive products, and tailored promotional curations.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-2 flex-shrink-0"></span>
                                    <span>Continually refine and improve our digital storefront and concierge services.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-2 flex-shrink-0"></span>
                                    <span>Detect, prevent, and mitigate fraudulent transactions to ensure a safe environment.</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-baseline gap-4 mb-4">
                            <span className="text-sm font-bold text-stone-300 tracking-widest">03</span>
                            <h2 className="text-xl font-light text-stone-900">Data Security</h2>
                        </div>
                        <div className="pl-9 space-y-4 text-sm text-stone-500 leading-relaxed">
                            <p>
                                Your privacy is our utmost priority. We implement state-of-the-art security measures to maintain the safety and integrity of your personal information whenever you place an order, or access your account.
                            </p>
                            <p>
                                All sensitive transactions are processed through highly secure, encrypted gateway providers and are never stored or processed directly on our servers.
                            </p>
                        </div>
                    </section>

                </div>

                {/* Editorial Contact CTA */}
                <div className="border-t border-stone-100 pt-16 mt-20 text-center">
                    <div className="w-14 h-14 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-900">
                        <FiLock size={20} />
                    </div>
                    <h3 className="text-xl font-light text-stone-900 mb-3">Privacy Inquiries</h3>
                    <p className="text-sm text-stone-500 mb-8 max-w-md mx-auto">
                        Our dedicated privacy team is available to help you understand how we protect, manage, and utilize your personal data.
                    </p>
                    <Link
                        href="/contact"
                        className="inline-block bg-stone-900 text-white text-xs font-bold tracking-widest uppercase px-10 py-4 rounded-full hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/10"
                    >
                        Contact Privacy Team
                    </Link>
                </div>

            </div>
        </main>
    );
}