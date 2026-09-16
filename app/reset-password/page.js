"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiCheck, FiAlertCircle, FiLock, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Query Params
    const urlTokenHash = searchParams.get('token_hash') || '';
    const urlEmail = searchParams.get('email') || '';

    // Form State
    const [tokenHash, setTokenHash] = useState(urlTokenHash);
    const [email, setEmail] = useState(urlEmail);
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // UI States
    const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState('');
    const [shake, setShake] = useState(false);

    useEffect(() => {
        if (urlTokenHash) setTokenHash(urlTokenHash);
        if (urlEmail) setEmail(urlEmail);
    }, [urlTokenHash, urlEmail]);

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        // Password Validation
        if (!password || password.length < 8) {
            setErrorMessage('Password must be at least 8 characters long');
            setStatus('error');
            triggerShake();
            return;
        }
        if (!/[A-Z]/.test(password)) {
            setErrorMessage('Password must contain at least one uppercase letter');
            setStatus('error');
            triggerShake();
            return;
        }
        if (!/[0-9]/.test(password)) {
            setErrorMessage('Password must contain at least one number');
            setStatus('error');
            triggerShake();
            return;
        }
        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match');
            setStatus('error');
            triggerShake();
            return;
        }

        // If no token_hash, ensure email + OTP are provided
        if (!tokenHash && (!email || !otp)) {
            setErrorMessage('Please enter your registered email and the 6-digit recovery code');
            setStatus('error');
            triggerShake();
            return;
        }

        setStatus('loading');

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    password: password,
                    token_hash: tokenHash || undefined,
                    otp: otp ? otp.trim() : undefined
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to reset password.');
            }

            setStatus('success');

        } catch (error) {
            console.error('Password reset submit error:', error);
            setErrorMessage(error.message || 'Unable to update password. Please try again.');
            setStatus('error');
            triggerShake();
        }
    };

    return (
        <div className="max-w-md w-full">
            {status !== 'success' ? (
                <div className={`bg-white border border-stone-100 rounded-3xl p-8 sm:p-10 shadow-xl shadow-stone-200/40 animate-fade-in ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
                    <div className="text-center mb-8">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2 block">
                            Security Credentials
                        </span>
                        <h2 className="text-2xl font-serif font-light text-stone-900">
                            Create New <span className="italic font-bold">Password</span>
                        </h2>
                        <p className="text-xs text-stone-500 mt-2">
                            Enter your new password below to secure your ShopHub account.
                        </p>
                    </div>

                    {errorMessage && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2 animate-fade-in">
                            <FiAlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* If token_hash was NOT provided in the URL, ask for email and OTP */}
                        {!tokenHash && (
                            <>
                                <div>
                                    <label className="block text-[11px] font-bold tracking-wider uppercase text-stone-700 mb-1.5">
                                        Registered Email
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        required
                                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold tracking-wider uppercase text-stone-700 mb-1.5">
                                        Security Recovery Code (OTP)
                                    </label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="6 or 8-digit code from email"
                                        required
                                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-900 focus:bg-white tracking-widest text-center font-mono transition-colors"
                                    />
                                </div>
                            </>
                        )}

                        {/* New Password */}
                        <div>
                            <label className="block text-[11px] font-bold tracking-wider uppercase text-stone-700 mb-1.5">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Minimum 8 characters"
                                    required
                                    disabled={status === 'loading'}
                                    className="w-full px-4 py-3 pr-11 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors"
                                >
                                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                </button>
                            </div>
                            <span className="text-[10px] text-stone-400 block mt-1">
                                Must contain at least 8 characters, 1 uppercase letter, and 1 number.
                            </span>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-[11px] font-bold tracking-wider uppercase text-stone-700 mb-1.5">
                                Confirm Password
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter new password"
                                required
                                disabled={status === 'loading'}
                                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold tracking-widest uppercase text-xs py-4 rounded-full transition-all flex justify-center items-center shadow-lg shadow-stone-900/20 disabled:opacity-70 pt-3.5 pb-3.5 mt-2"
                        >
                            {status === 'loading' ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Updating Password...
                                </span>
                            ) : (
                                'Commit New Password'
                            )}
                        </button>
                    </form>
                </div>
            ) : (
                /* Success State Card */
                <div className="bg-stone-50 border border-stone-200/80 rounded-3xl p-10 text-center animate-fade-in shadow-xl shadow-stone-200/40">
                    <div className="inline-flex justify-center items-center w-16 h-16 bg-stone-900 rounded-full mb-6 shadow-xl shadow-stone-900/20 text-white">
                        <FiCheck size={28} />
                    </div>
                    <h3 className="text-2xl font-serif font-light text-stone-900 mb-2">Password Updated</h3>
                    <p className="text-stone-500 mb-8 text-sm leading-relaxed">
                        Your password has been changed successfully. You can now sign in with your updated credentials.
                    </p>

                    <Link
                        href={`/login?email=${encodeURIComponent(email)}`}
                        className="w-full inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-bold tracking-widest uppercase text-xs py-4 rounded-full transition-all shadow-lg shadow-stone-900/20"
                    >
                        Sign In Now <FiArrowRight size={14} />
                    </Link>
                </div>
            )}
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <main className="animate-fade-in bg-white min-h-screen flex flex-col pb-20">
            {/* Minimalist Editorial Header */}
            <div className="pt-20 pb-10 text-center">
                <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-4 block">
                    Account Security
                </span>
                <h1 className="text-4xl md:text-5xl font-light text-stone-900 tracking-tight">
                    Update <span className="font-serif italic font-bold">Password</span>
                </h1>
            </div>

            {/* Reset Content Wrapped in Suspense */}
            <div className="flex-grow flex items-start justify-center px-4 sm:px-6 lg:px-8 pt-4">
                <Suspense fallback={
                    <div className="text-stone-400 text-xs font-bold uppercase tracking-widest py-10">
                        Loading Security Concierge...
                    </div>
                }>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </main>
    );
}
