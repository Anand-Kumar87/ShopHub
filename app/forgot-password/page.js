"use client";

import { useState } from 'react';
import Link from 'next/link';
import { FiCheck, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        // Basic validation
        if (!email) {
            setErrorMessage('Please enter your email address');
            setStatus('error');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setErrorMessage('Please enter a valid email address');
            setStatus('error');
            return;
        }

        setStatus('loading');

        try {
            // API call simulation (Replace with actual backend endpoint later)
            const resetToken = Math.random().toString(36).substring(2, 15);
            const resetUrl = `${window.location.origin}/reset-password?token=${resetToken}`;

            // Simulating a network request delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            /* 
            // Real API Call Implementation (Uncomment when backend is ready)
            const response = await fetch('/api/send-reset-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, resetUrl })
            });

            if (!response.ok) {
                throw new Error('Failed to send reset email');
            }
            */

            setStatus('success');
        } catch (error) {
            console.error('Error:', error);
            setErrorMessage('Failed to send reset email. Please try again.');
            setStatus('error');
        }
    };

    const handleRequestNewLink = () => {
        setEmail('');
        setStatus('idle');
        setErrorMessage('');
    };

    return (
        <main className="animate-fade-in bg-white min-h-screen flex flex-col pb-20">

            {/* Minimalist Editorial Header */}
            <div className="pt-20 pb-10 text-center">
                <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-4 block">
                    Account Recovery
                </span>
                <h1 className="text-4xl md:text-5xl font-light text-stone-900 tracking-tight">
                    Reset <span className="font-serif italic font-bold">Password</span>
                </h1>
            </div>

            {/* Forgot Password Content */}
            <div className="flex-grow flex items-start justify-center px-4 sm:px-6 lg:px-8 pt-4">
                <div className="max-w-md w-full">

                    {status !== 'success' ? (
                        <div className={`animate-fade-in ${status === 'error' ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
                            <p className="text-stone-500 mb-8 text-sm text-center leading-relaxed">
                                Enter the email address associated with your account, and we will send you a secure link to reset your password.
                            </p>

                            <form onSubmit={handleSubmit}>
                                <div className="mb-6">
                                    <label htmlFor="email" className="block text-xs font-bold tracking-widest uppercase text-stone-900 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={status === 'loading'}
                                        className={`w-full px-5 py-3.5 bg-stone-50 border rounded-lg focus:outline-none transition-colors text-sm ${status === 'error'
                                                ? 'border-red-400 focus:border-red-500 bg-red-50/10'
                                                : 'border-transparent focus:border-stone-900 focus:bg-white'
                                            }`}
                                        placeholder="Enter your email"
                                    />
                                    {status === 'error' && (
                                        <div className="mt-3 text-red-500 text-xs font-medium flex items-center gap-1.5">
                                            <FiAlertCircle size={14} /> {errorMessage}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold tracking-widest uppercase text-xs py-4 rounded-full transition-colors flex justify-center items-center disabled:opacity-70 shadow-lg shadow-stone-900/20 mb-8"
                                >
                                    {status === 'loading' ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Sending Link...
                                        </>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </button>
                            </form>
                        </div>
                    ) : (
                        /* Success State */
                        <div className="bg-stone-50 border border-stone-100 rounded-3xl p-10 text-center animate-fade-in mt-4">
                            <div className="inline-flex justify-center items-center w-16 h-16 bg-stone-900 rounded-full mb-6 shadow-xl shadow-stone-900/20">
                                <FiCheck className="text-3xl text-white" />
                            </div>
                            <h3 className="text-2xl font-light text-stone-900 mb-2">Check Your Email</h3>
                            <p className="text-stone-500 mb-8 text-sm leading-relaxed">
                                We've sent password reset instructions to:<br />
                                <span className="font-bold text-stone-900 block mt-1">{email}</span>
                            </p>

                            <div className="text-left bg-white border border-stone-100 p-6 rounded-2xl mb-8">
                                <h4 className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-4">Next Steps</h4>
                                <ul className="text-sm text-stone-600 space-y-3">
                                    <li className="flex items-start gap-3">
                                        <span className="text-stone-300 font-bold">01</span> Check your email inbox.
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-stone-300 font-bold">02</span> Look for an email from ShopHub.
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-stone-300 font-bold">03</span> Click the secure reset link.
                                    </li>
                                </ul>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-bold tracking-widest uppercase">
                                <button onClick={handleRequestNewLink} className="text-stone-400 hover:text-stone-900 transition-colors">
                                    Resend Link
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Return to Login */}
                    {status !== 'success' && (
                        <div className="mt-4 text-center">
                            <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-stone-500 hover:text-stone-900 transition-colors border-b border-transparent hover:border-stone-900 pb-0.5">
                                <FiArrowLeft size={14} /> Back to Sign In
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}