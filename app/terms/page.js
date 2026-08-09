import Link from 'next/link';
import { FiShield } from 'react-icons/fi';

export const metadata = {
    title: 'Terms & Conditions | ShopHub',
    description: 'Read the terms and conditions for using ShopHub services.',
};

export default function TermsPage() {
    return (
        <main className="bg-white min-h-screen animate-fade-in pb-24">

            {/* Minimalist Editorial Header */}
            <div className="bg-stone-50 pt-24 pb-20 border-b border-stone-200 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-4 block">
                        Legal Information
                    </span>
                    <h1 className="text-4xl md:text-6xl font-light text-stone-900 tracking-tight mb-6">
                        Terms & <span className="font-serif italic font-bold">Conditions</span>
                    </h1>
                    <p className="text-stone-500 text-sm md:text-base max-w-xl mx-auto tracking-widest uppercase">
                        Effective Date: {new Date().toLocaleDateString('en-GB')}
                    </p>
                </div>
            </div>

            {/* Typography-Driven Content Section */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
                <div className="space-y-16">

                    <section>
                        <div className="flex items-baseline gap-4 mb-4">
                            <span className="text-sm font-bold text-stone-300 tracking-widest">01</span>
                            <h2 className="text-xl font-light text-stone-900">Introduction</h2>
                        </div>
                        <div className="pl-9 space-y-4 text-sm text-stone-500 leading-relaxed">
                            <p>
                                Welcome to ShopHub. These Terms and Conditions govern your use of our website, mobile applications, and services. By accessing or using our curated platforms, you agree to be bound by these elegant but binding terms.
                            </p>
                            <p>
                                If you disagree with any part of these terms, we respectfully ask that you refrain from accessing our services.
                            </p>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-baseline gap-4 mb-4">
                            <span className="text-sm font-bold text-stone-300 tracking-widest">02</span>
                            <h2 className="text-xl font-light text-stone-900">Intellectual Property Rights</h2>
                        </div>
                        <div className="pl-9 space-y-4 text-sm text-stone-500 leading-relaxed">
                            <p>
                                Other than the content you own, under these Terms, ShopHub and/or its licensors own all the intellectual property rights, photography, branding, and materials contained in this website.
                            </p>
                            <p>
                                You are granted a limited, non-exclusive license strictly for the purpose of viewing the material contained on this website and curating your personal shopping experience.
                            </p>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-baseline gap-4 mb-4">
                            <span className="text-sm font-bold text-stone-300 tracking-widest">03</span>
                            <h2 className="text-xl font-light text-stone-900">User Accounts</h2>
                        </div>
                        <div className="pl-9">
                            <ul className="space-y-4 text-sm text-stone-500 leading-relaxed">
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-2 flex-shrink-0"></span>
                                    <span>You are exclusively responsible for safeguarding the password and credentials used to access our services.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-2 flex-shrink-0"></span>
                                    <span>You must notify our concierge team immediately upon becoming aware of any breach of security or unauthorized use of your account.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-2 flex-shrink-0"></span>
                                    <span>You may not use as a username the name of another person or entity that is not lawfully available for use.</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-baseline gap-4 mb-4">
                            <span className="text-sm font-bold text-stone-300 tracking-widest">04</span>
                            <h2 className="text-xl font-light text-stone-900">Pricing and Availability</h2>
                        </div>
                        <div className="pl-9 space-y-4 text-sm text-stone-500 leading-relaxed">
                            <p>
                                Our collections are carefully curated, and all prices are subject to change without notice. We reserve the right to modify or discontinue a product or collection without prior announcement at any time.
                            </p>
                            <p>
                                We shall not be liable to you or to any third-party for any modification, price change, suspension, or discontinuance of the service or products.
                            </p>
                        </div>
                    </section>

                </div>

                {/* Editorial Contact CTA */}
                <div className="border-t border-stone-100 pt-16 mt-20 text-center">
                    <div className="w-14 h-14 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-900">
                        <FiShield size={20} />
                    </div>
                    <h3 className="text-xl font-light text-stone-900 mb-3">Have legal inquiries?</h3>
                    <p className="text-sm text-stone-500 mb-8 max-w-md mx-auto">
                        Reach out to our legal and compliance team for any clarifications regarding our terms of service or privacy practices.
                    </p>
                    <Link
                        href="/contact"
                        className="inline-block bg-stone-900 text-white text-xs font-bold tracking-widest uppercase px-10 py-4 rounded-full hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/10"
                    >
                        Contact Legal Team
                    </Link>
                </div>

            </div>
        </main>
    );
}