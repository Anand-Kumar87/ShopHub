'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiMinus } from 'react-icons/fi';

export default function FAQsPage() {
    const [faqs, setFaqs] = useState([]);
    const [openId, setOpenId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                // Tries to fetch from your real backend API
                const res = await fetch('/api/faqs');
                if (res.ok) {
                    const data = await res.json();
                    setFaqs(data);
                } else {
                    throw new Error('API endpoint not ready yet');
                }
            } catch (error) {
                console.warn("Using fallback data until real API is connected.");
                // Premium Fallback Data (Will be replaced by real DB data automatically later)
                setFaqs([
                    { id: 1, question: "What is your return and exchange policy?", answer: "We offer a 30-day return window for all unworn, unwashed items with original tags attached. Refunds are processed to the original payment method within 5-7 business days." },
                    { id: 2, question: "How long will it take to receive my order?", answer: "Standard domestic shipping requires 3-5 business days. Express options are available at checkout. International delivery timelines vary by destination." },
                    { id: 3, question: "Do you offer international shipping?", answer: "Yes, we proudly ship our curated collections to over 100 countries worldwide. Please note that customs duties and taxes are the responsibility of the recipient." },
                    { id: 4, question: "How can I track my package?", answer: "Once your order is dispatched, you will receive an email containing a secure tracking link. You may also monitor your order status directly through your Account dashboard." },
                    { id: 5, question: "Are your products sustainably sourced?", answer: "Absolutely. We are committed to ethical craftsmanship. The majority of our materials are sustainably sourced, and we partner exclusively with certified, fair-trade artisans." }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchFaqs();
    }, []);

    if (loading) {
        return (
            <main className="bg-white min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
                <div className="animate-pulse space-y-8 mt-12">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="border-b border-stone-100 pb-6">
                            <div className="h-4 bg-stone-100 w-3/4 rounded mb-2"></div>
                        </div>
                    ))}
                </div>
            </main>
        );
    }

    return (
        <main className="bg-white min-h-screen pb-24 animate-fade-in">

            {/* Minimalist Editorial Header */}
            <div className="bg-stone-50 pt-24 pb-20 border-b border-stone-200 px-4 mb-16">
                <div className="max-w-3xl mx-auto text-center">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-4 block">
                        Client Services
                    </span>
                    <h1 className="text-4xl md:text-5xl font-light text-stone-900 tracking-tight">
                        Common <span className="font-serif italic font-bold">Inquiries</span>
                    </h1>
                </div>
            </div>

            {/* Typography-Driven Accordion */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="divide-y divide-stone-200 border-t border-stone-200">
                    {faqs.map((faq) => (
                        <div key={faq.id} className="group">
                            <button
                                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                                className="w-full text-left py-6 flex justify-between items-center focus:outline-none"
                                aria-expanded={openId === faq.id}
                            >
                                <span className={`text-base md:text-lg font-light transition-colors duration-300 pr-8 ${openId === faq.id ? 'text-stone-900' : 'text-stone-600 group-hover:text-stone-900'}`}>
                                    {faq.question}
                                </span>
                                <span className="flex-shrink-0 text-stone-400 group-hover:text-stone-900 transition-colors duration-300">
                                    {openId === faq.id ? <FiMinus size={20} strokeWidth={1.5} /> : <FiPlus size={20} strokeWidth={1.5} />}
                                </span>
                            </button>

                            {/* Smooth reveal answer */}
                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openId === faq.id ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}
                            >
                                <p className="text-sm text-stone-500 leading-relaxed pr-8">
                                    {faq.answer}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Additional Help CTA */}
                <div className="mt-20 text-center pt-10">
                    <p className="text-sm text-stone-500 mb-6">
                        Cannot find the answer you are looking for? Our concierge team is ready to assist you.
                    </p>
                    <a
                        href="/contact"
                        className="text-xs font-bold tracking-widest uppercase text-stone-900 border-b border-stone-900 pb-0.5 hover:text-stone-500 hover:border-stone-500 transition-colors"
                    >
                        Contact Support
                    </a>
                </div>
            </div>
        </main>
    );
}