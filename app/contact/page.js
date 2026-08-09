"use client";

import { useState } from 'react';
import Link from 'next/link';
import {
    FiPhone,
    FiMail,
    FiMapPin,
    FiNavigation,
    FiPlus,
    FiMinus,
    FiCheck,
    FiAlertCircle
} from 'react-icons/fi';

// --- Static Data for DRY Code ---
const CONTACT_INFO = [
    { id: 1, title: 'Call Us', desc: 'Our concierge team is available Mon-Fri, 9am-6pm.', value: '+91 8726540277', icon: FiPhone, link: 'tel:+918726540277' },
    { id: 2, title: 'Email Us', desc: 'Our team will respond to your inquiry within 24 hours.', value: 'concierge@shophub.com', icon: FiMail, link: 'mailto:support@shophub.com' },
    { id: 3, title: 'Visit Us', desc: 'Discover our flagship store and headquarters.', value: 'F-3, Mandelia Road, Kamla Nagar, New Delhi 110007', icon: FiMapPin, link: null },
];

const FAQS = [
    { id: 1, question: 'How can I track my order?', answer: 'Once your order is dispatched, you will receive an email containing a secure tracking link. You may also monitor your order status directly through your Account dashboard.' },
    { id: 2, question: 'What is your return policy?', answer: 'We offer a 30-day return window for all unworn, unwashed items with original tags attached. Refunds are processed to the original payment method within 5-7 business days.' },
    { id: 3, question: 'How long does shipping take?', answer: 'Standard domestic shipping requires 3-5 business days. Express options are available at checkout. International delivery timelines vary by destination.' },
    { id: 4, question: 'Do you ship internationally?', answer: 'Yes, we proudly ship our curated collections to over 100 countries worldwide. Please note that customs duties and taxes are the responsibility of the recipient.' },
];

export default function ContactPage() {
    // Form State
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', phone: '', subject: '', message: '', consentGiven: false
    });

    // Notification State
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });

    // FAQ Accordion State
    const [openFaqId, setOpenFaqId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const showNotification = (type, message) => {
        setNotification({ show: true, type, message });
        setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // 🔥 REAL API CALL TO SEND EMAIL
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error("Failed to send message");

            // LocalStorage for Admin Panel reference (Optional but good)
            const newMessage = { ...formData, timestamp: new Date().toISOString(), status: 'unread' };
            const existingMessages = JSON.parse(localStorage.getItem('shophub_contact_messages')) || [];
            localStorage.setItem('shophub_contact_messages', JSON.stringify([newMessage, ...existingMessages]));

            // Reset Form & Show Success
            setFormData({ firstName: '', lastName: '', email: '', phone: '', subject: '', message: '', consentGiven: false });
            showNotification('success', 'Thank you for your inquiry. Our concierge team will contact you shortly.');
        } catch (error) {
            console.error(error);
            showNotification('error', 'Something went wrong. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleFaq = (id) => {
        setOpenFaqId(openFaqId === id ? null : id);
    };

    return (
        <main className="animate-fade-in bg-white min-h-screen pb-24">

            {/* Minimalist Editorial Header */}
            <div className="bg-stone-50 pt-24 pb-20 border-b border-stone-200 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-4 block">
                        Concierge Services
                    </span>
                    <h1 className="text-4xl md:text-6xl font-light text-stone-900 tracking-tight mb-6">
                        Get in <span className="font-serif italic font-bold">Touch</span>
                    </h1>
                    <p className="text-stone-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                        We invite you to reach out to our dedicated team. Whether you have an inquiry about a collection, sizing, or an existing order, we are here to assist.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">

                {/* Contact Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                    {CONTACT_INFO.map(info => {
                        const Icon = info.icon;
                        return (
                            <div key={info.id} className="bg-white rounded-2xl p-10 text-center border border-stone-100 hover:border-stone-200 hover:shadow-2xl hover:shadow-stone-200/50 transition-all duration-500 group">
                                <div className="flex justify-center mb-6">
                                    <div className="w-14 h-14 bg-stone-50 text-stone-900 rounded-full flex items-center justify-center group-hover:bg-stone-900 group-hover:text-white transition-colors duration-500">
                                        <Icon size={20} strokeWidth={1.5} />
                                    </div>
                                </div>
                                <h3 className="text-xs font-bold tracking-widest uppercase text-stone-900 mb-3">{info.title}</h3>
                                <p className="text-sm text-stone-500 mb-6 h-10">{info.desc}</p>
                                {info.link ? (
                                    <a href={info.link} className="text-sm font-bold text-stone-900 hover:text-stone-500 transition-colors border-b border-stone-900 pb-0.5 hover:border-stone-500">
                                        {info.value}
                                    </a>
                                ) : (
                                    <span className="text-sm font-bold text-stone-900">{info.value}</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Contact Form & Map Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-24">

                    {/* Form */}
                    <div>
                        <h2 className="text-3xl font-light text-stone-900 mb-2">Send an Inquiry</h2>
                        <p className="text-sm text-stone-500 mb-10 leading-relaxed">
                            Please fill out the form below. We aim to respond to all inquiries within 24 hours.
                        </p>

                        {notification.show && (
                            <div className={`mb-8 p-4 rounded-xl flex items-start gap-3 border ${notification.type === 'success' ? 'bg-stone-900 text-white border-stone-900' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                <div className="mt-0.5">
                                    {notification.type === 'success' ? <FiCheck size={18} /> : <FiAlertCircle size={18} />}
                                </div>
                                <p className="text-sm font-medium leading-relaxed">{notification.message}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="firstName" className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">First Name *</label>
                                    <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="lastName" className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Last Name *</label>
                                    <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} required className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm" />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Email Address *</label>
                                <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="phone" className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Phone Number</label>
                                    <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="subject" className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Subject *</label>
                                    <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleInputChange} required className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm" />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Message *</label>
                                <textarea id="message" name="message" rows="5" value={formData.message} onChange={handleInputChange} required className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm resize-none"></textarea>
                            </div>

                            <div className="flex items-start">
                                <div className="relative flex items-center mt-1">
                                    <input type="checkbox" id="consentGiven" name="consentGiven" checked={formData.consentGiven} onChange={handleInputChange} required className="peer h-4 w-4 appearance-none border border-stone-300 rounded-sm checked:bg-stone-900 checked:border-stone-900 transition-colors cursor-pointer" />
                                    <FiCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xs opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                </div>
                                <label htmlFor="consentGiven" className="ml-3 block text-sm text-stone-500 leading-relaxed cursor-pointer hover:text-stone-900 transition-colors">
                                    I agree to the <Link href="/privacy" className="text-stone-900 underline underline-offset-4">Privacy Policy</Link> and consent to ShopHub processing my personal data to handle my inquiry.
                                </label>
                            </div>

                            <button type="submit" disabled={isSubmitting} className="w-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold tracking-widest uppercase px-10 py-4 rounded-full transition-colors shadow-lg shadow-stone-900/10 flex items-center justify-center disabled:opacity-70 mt-4">
                                {isSubmitting ? (
                                    <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Sending...</>
                                ) : 'Send Message'}
                            </button>
                        </form>
                    </div>

                    {/* Location & Hours Sidebar */}
                    <div className="space-y-12 lg:sticky lg:top-24">

                        {/* Premium Map */}
                        <div>
                            <h2 className="text-3xl font-light text-stone-900 mb-6">Our Flagship</h2>
                            <div className="rounded-2xl overflow-hidden border border-stone-200 relative group">
                                {/* Grayscale filter gives a premium architectural feel to the map */}
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3500.9628060723384!2d77.2006473759177!3d28.66957868228852!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd6bcb07c7ad%3A0x34cdb3a39ee1f37e!2sKamla%20Nagar%2C%20Delhi%2C%20110007!5e0!3m2!1sen!2sin!4v1720621421211!5m2!1sen!2sin"
                                    width="100%"
                                    height="300"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    className="w-full grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                                ></iframe>
                            </div>

                            <div className="mt-8 space-y-4 text-sm text-stone-600">
                                <p className="flex items-start gap-4">
                                    <FiMapPin className="text-stone-400 mt-0.5" size={18} />
                                    <span>F-3, Mandelia Road, Kamla Nagar<br />New Delhi 110007, India</span>
                                </p>
                                <p className="flex items-center gap-4">
                                    <FiNavigation className="text-stone-400" size={18} />
                                    <a href="https://www.google.com/maps/dir//Kamla+Nagar,+Delhi,+110007/@28.6689531,77.2027893,16z/" target="_blank" rel="noreferrer" className="font-bold text-stone-900 border-b border-stone-900 pb-0.5 hover:text-stone-500 hover:border-stone-500 transition-colors">Get Directions</a>
                                </p>
                            </div>
                        </div>

                        {/* Minimalist Hours */}
                        <div className="bg-stone-50 p-8 rounded-2xl border border-stone-100">
                            <h3 className="text-xs font-bold tracking-widest uppercase text-stone-900 mb-6">Business Hours</h3>
                            <div className="space-y-4 text-sm text-stone-600">
                                <div className="flex justify-between border-b border-stone-200/50 pb-4">
                                    <span>Monday - Friday</span>
                                    <span className="font-medium text-stone-900">9:00 AM - 6:00 PM</span>
                                </div>
                                <div className="flex justify-between border-b border-stone-200/50 pb-4">
                                    <span>Saturday</span>
                                    <span className="font-medium text-stone-900">10:00 AM - 4:00 PM</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Sunday</span>
                                    <span className="font-medium text-stone-400 italic font-serif">Closed</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAQ Section (Redesigned Editorial Style) */}
                <div className="border-t border-stone-200 pt-20">
                    <div className="text-center mb-12 max-w-2xl mx-auto">
                        <h2 className="text-3xl font-light text-stone-900 mb-4">Frequently Asked</h2>
                        <p className="text-sm text-stone-500 leading-relaxed">
                            Find quick answers to common questions. If you cannot find what you're looking for, please submit an inquiry above.
                        </p>
                    </div>

                    <div className="max-w-3xl mx-auto divide-y divide-stone-200 border-t border-stone-200">
                        {FAQS.map((faq) => (
                            <div key={faq.id} className="group">
                                <button
                                    onClick={() => toggleFaq(faq.id)}
                                    className="w-full text-left py-6 flex justify-between items-center focus:outline-none"
                                >
                                    <span className={`text-sm md:text-base font-medium transition-colors duration-300 pr-8 ${openFaqId === faq.id ? 'text-stone-900' : 'text-stone-600 group-hover:text-stone-900'}`}>
                                        {faq.question}
                                    </span>
                                    <span className="flex-shrink-0 text-stone-400 group-hover:text-stone-900 transition-colors duration-300">
                                        {openFaqId === faq.id ? <FiMinus size={18} /> : <FiPlus size={18} />}
                                    </span>
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaqId === faq.id ? 'max-h-40 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
                                    <p className="text-sm text-stone-500 leading-relaxed pr-8">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-10">
                        <Link href="/faqs" className="text-xs font-bold tracking-widest uppercase text-stone-900 border-b border-stone-900 pb-0.5 hover:text-stone-500 hover:border-stone-500 transition-colors">
                            View All FAQs
                        </Link>
                    </div>
                </div>

            </div>
        </main>
    );
}