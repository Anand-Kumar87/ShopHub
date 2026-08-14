'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiBookOpen, FiCheckCircle, FiCopy, FiArrowRight, FiShield, FiMail } from 'react-icons/fi';
import toast from 'react-hot-toast';
import MagneticButton from '../components/MagneticButton';

export default function StudentPortal() {
    const [email, setEmail] = useState('');
    const [university, setUniversity] = useState('');
    const [status, setStatus] = useState('idle'); // idle, verifying, success, error
    const [discountCode, setDiscountCode] = useState('');

    const handleVerification = (e) => {
        e.preventDefault();
        
        // बेसिक ईमेल वैलिडेशन (सिर्फ .edu या .ac.in डोमेन के लिए)
        const isStudentEmail = email.toLowerCase().endsWith('.edu') || email.toLowerCase().endsWith('.ac.in') || email.toLowerCase().endsWith('.edu.in');

        setStatus('verifying');

        // असली वेरिफिकेशन की फील देने के लिए 2.5 सेकंड का लोडिंग इफ़ेक्ट
        setTimeout(() => {
            if (isStudentEmail) {
                setStatus('success');
                setDiscountCode('STUDENT10'); // आप इसे अपने हिसाब से बदल सकते हैं
                toast.success('Student status verified successfully!', { icon: '🎓' });
            } else {
                setStatus('error');
                toast.error('Please use a valid university email (.edu or .ac.in)', { icon: '⚠️' });
            }
        }, 2500);
    };

    const copyCode = () => {
        navigator.clipboard.writeText(discountCode);
        toast.success('Discount code copied to clipboard!');
    };

    return (
        <main className="min-h-screen bg-stone-50 pt-24 pb-20 animate-fade-in relative selection:bg-stone-200">
            {/* Header Section */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
                <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-4 block">ShopHub Education</span>
                <h1 className="text-4xl md:text-5xl font-light text-stone-900 tracking-tight mb-4">
                    Unlock Your <span className="font-serif italic font-bold">10% Off</span>
                </h1>
                <p className="text-stone-500 text-sm">
                    Because your style shouldn't be limited by your student budget. Verify your status instantly and get 10% off your next purchase.
                </p>
            </div>

            {/* Verification Card */}
            <div className="max-w-xl mx-auto px-4 sm:px-6">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-100">
                    
                    {/* Top Accent Bar */}
                    <div className="h-2 bg-stone-900 w-full"></div>

                    <div className="p-8 md:p-10">
                        {status === 'idle' || status === 'error' ? (
                            <form onSubmit={handleVerification} className="space-y-6 animate-fade-in">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-stone-100">
                                        <FiBookOpen size={24} className="text-stone-900" />
                                    </div>
                                    <h2 className="text-xl font-medium text-stone-900">Verify Student Status</h2>
                                </div>

                                {status === 'error' && (
                                    <div className="bg-red-50 text-red-600 text-xs p-4 rounded-xl border border-red-100 flex items-start gap-3">
                                        <FiShield className="mt-0.5 flex-shrink-0" />
                                        <p>Verification failed. Make sure you are using an official university email address ending in <strong>.edu</strong> or <strong>.ac.in</strong>.</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">University / College Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={university}
                                        onChange={(e) => setUniversity(e.target.value)}
                                        placeholder="e.g. Delhi University" 
                                        className="w-full px-5 py-4 bg-stone-50 border border-transparent rounded-xl focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Student Email Address</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-stone-400">
                                            <FiMail size={16} />
                                        </div>
                                        <input 
                                            type="email" 
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="student@university.edu" 
                                            className="w-full pl-12 pr-5 py-4 bg-stone-50 border border-transparent rounded-xl focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button 
                                        type="submit" 
                                        className="w-full bg-stone-900 text-white rounded-xl py-4 text-xs font-bold tracking-widest uppercase hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/20"
                                    >
                                        Verify Now
                                    </button>
                                </div>
                                <p className="text-center text-[10px] text-stone-400 mt-4">
                                    By verifying, you agree to our Terms of Service. Validation is secure and instant.
                                </p>
                            </form>
                        ) : status === 'verifying' ? (
                            <div className="py-16 flex flex-col items-center justify-center animate-fade-in text-center">
                                <div className="relative w-20 h-20 mb-6">
                                    <div className="absolute inset-0 border-4 border-stone-100 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-stone-900 rounded-full border-t-transparent animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <FiShield className="text-stone-900 animate-pulse" size={24} />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-stone-900 mb-2">Verifying Credentials</h3>
                                <p className="text-sm text-stone-500">Securely checking your university status...</p>
                            </div>
                        ) : (
                            <div className="py-8 flex flex-col items-center justify-center animate-fade-in text-center">
                                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 border border-green-100">
                                    <FiCheckCircle size={32} className="text-green-600" />
                                </div>
                                <h3 className="text-2xl font-light text-stone-900 mb-2">Verification Successful!</h3>
                                <p className="text-sm text-stone-500 mb-8 max-w-sm">
                                    Welcome to the club. Here is your exclusive 10% off promo code. Use it at checkout.
                                </p>

                                <div className="bg-stone-50 w-full p-6 rounded-2xl border border-stone-200 border-dashed mb-8 relative group">
                                    <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2 block">Your Unique Code</span>
                                    <div className="text-3xl font-mono font-bold text-stone-900 tracking-wider">
                                        {discountCode}
                                    </div>
                                    <button 
                                        onClick={copyCode}
                                        className="absolute top-1/2 -translate-y-1/2 right-6 p-2 text-stone-400 hover:text-stone-900 hover:bg-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                        title="Copy Code"
                                    >
                                        <FiCopy size={20} />
                                    </button>
                                </div>

                                <Link href="/shop" className="w-full">
                                    <button className="w-full bg-stone-900 text-white rounded-xl py-4 text-xs font-bold tracking-widest uppercase hover:bg-stone-800 transition-colors flex items-center justify-center gap-2">
                                        Shop The Collection <FiArrowRight />
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
