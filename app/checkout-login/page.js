'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../utils/supabase';
import toast from 'react-hot-toast';
import { FiMail, FiCheckCircle, FiArrowRight, FiLock, FiShoppingBag } from 'react-icons/fi';

export default function CheckoutLoginPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // States
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [redirectTo, setRedirectTo] = useState('/checkout'); // Default to checkout

    useEffect(() => {
        setMounted(true);
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect');
        if (redirect) setRedirectTo(redirect);

        // अगर पहले से लॉगिन है तो सीधा चेकआउट पर भेज दो
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) router.push(redirect || '/checkout');
        };
        checkUser();
    }, [router]);

    if (!mounted) return null;

    // 1. Send OTP / Magic Link
    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!email) return toast.error("Please enter your email address.");

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: email,
                options: {
                    emailRedirectTo: `${window.location.origin}${redirectTo}`,
                }
            });

            if (error) throw error;

            setIsOtpSent(true);
            toast.success("Security code sent to your email!", { icon: '📨' });
        } catch (error) {
            toast.error(error.message || "Failed to send code. Try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // 2. Verify OTP and Login
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        // 🔥 FIX: Validation updated to accept 8-digit codes
        if (!otp || otp.length < 6) return toast.error("Please enter a valid secure code.");

        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email: email,
                token: otp,
                type: 'email'
            });

            if (error) throw error;

            if (data.session) {
                const userObj = {
                    id: data.session.user.id,
                    email: data.session.user.email,
                    firstName: data.session.user.user_metadata?.first_name || 'Client',
                    lastName: data.session.user.user_metadata?.last_name || '',
                };
                localStorage.setItem('currentUser', JSON.stringify(userObj));
                window.dispatchEvent(new Event('userStateChange'));

                toast.success("Login successful! Redirecting to checkout...", { icon: '✨' });
                router.push(redirectTo);
            }
        } catch (error) {
            toast.error("Invalid or expired code. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-stone-50 flex items-center justify-center py-20 px-4 animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden">

                {/* Fast Checkout Header */}
                <div className="bg-stone-900 text-center py-10 px-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
                    <div className="w-12 h-12 bg-white/20 text-white rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm relative z-10">
                        <FiShoppingBag size={20} />
                    </div>
                    <h2 className="text-2xl font-light text-white tracking-tight relative z-10">
                        Fast <span className="font-serif italic font-bold">Checkout</span>
                    </h2>
                    <p className="text-stone-400 text-sm mt-2 relative z-10">
                        {isOtpSent ? "Secure Verification" : "Enter email for instant login"}
                    </p>
                </div>

                <div className="p-8">
                    {!isOtpSent ? (
                        <form onSubmit={handleSendOtp} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <FiMail className="text-stone-400" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="concierge@example.com"
                                        className="w-full pl-11 pr-5 py-4 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm font-medium text-stone-900"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-stone-900 text-white rounded-xl py-4 text-xs font-bold tracking-widest uppercase hover:bg-stone-800 shadow-lg shadow-stone-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isLoading ? 'Sending...' : <>Continue to Checkout <FiArrowRight /></>}
                            </button>

                            <div className="text-center mt-6 pt-6 border-t border-stone-100">
                                <p className="text-xs text-stone-500 mb-2">Want to use password or social login?</p>
                                <Link href="/login" className="text-xs font-bold text-stone-900 hover:text-stone-500 transition-colors uppercase tracking-widest">
                                    Go to Standard Login
                                </Link>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fade-in">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <FiCheckCircle size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-stone-900">Check your inbox</h3>
                                {/* 🔥 FIX: Updated text to match dynamic length */}
                                <p className="text-sm text-stone-500 mt-1">We've sent a secure code and a magic link to <br /><span className="font-bold text-stone-900">{email}</span></p>
                            </div>

                            <div>
                                {/* 🔥 FIX: Updated Label */}
                                <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2 text-center">
                                    Enter Secure Code
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <FiLock className="text-stone-400" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        maxLength="8" /* 🔥 FIX: Changed maxLength from 6 to 8 */
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        placeholder="• • • • • • • •" /* 🔥 FIX: Updated placeholder dots */
                                        className="w-full pl-11 pr-5 py-4 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-center text-xl tracking-[0.4em] font-bold text-stone-900"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                // 🔥 FIX: Button unlocks if length is at least 6 (to support both 6 and 8 digit projects)
                                disabled={isLoading || otp.length < 6}
                                className="w-full bg-stone-900 text-white rounded-xl py-4 text-xs font-bold tracking-widest uppercase hover:bg-stone-800 shadow-lg shadow-stone-900/20 transition-all flex items-center justify-center disabled:opacity-50"
                            >
                                {isLoading ? 'Verifying...' : 'Complete Checkout'}
                            </button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => { setOtp(''); setIsOtpSent(false); }}
                                    className="text-xs text-stone-500 hover:text-stone-900 underline underline-offset-2 transition-colors"
                                >
                                    Use a different email address
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </main>
    );
}