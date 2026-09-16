'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiCheck, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import { FaGoogle, FaFacebookF } from 'react-icons/fa';
import { supabase } from '../utils/supabase';

export default function RegisterPage() {
    const router = useRouter();

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        terms: false
    });

    // UI States
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shake, setShake] = useState(false);
    const [existingAccountError, setExistingAccountError] = useState('');
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [redirectParam, setRedirectParam] = useState('');

    // If user is already logged in, redirect away safely
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect');
        if (redirect) setRedirectParam(redirect);

        async function checkExistingAuth() {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const safeRedirect = (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) ? redirect : '/account';
                window.location.assign(safeRedirect);
            }
        }
        checkExistingAuth();
    }, [router]);

    // Handlers
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        if (existingAccountError) {
            setExistingAccountError('');
        }
    };

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    // --- Z+ SECURE REGISTRATION SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setExistingAccountError('');
        const newErrors = {};

        // Validations
        if (!formData.firstName || formData.firstName.trim().length < 2) {
            newErrors.firstName = 'First name must be at least 2 characters';
        }
        if (!formData.lastName || formData.lastName.trim().length < 2) {
            newErrors.lastName = 'Last name must be at least 2 characters';
        }
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(formData.password)) {
            newErrors.password = 'Password must be at least 8 characters and include at least 1 uppercase letter, 1 lowercase letter, and 1 number';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.terms) {
            newErrors.terms = 'You must agree to the Terms and Privacy Policy';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            triggerShake();
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Submit through hardened Z+ Security API
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password
                })
            });

            const result = await response.json();

            // 2. Handle Existing Account or Duplicate Email Block
            if (!response.ok || response.status === 409) {
                const errMsg = result.error || 'An account with this email address already exists.';
                setExistingAccountError(errMsg);
                setErrors({ email: errMsg });
                triggerShake();
                setIsSubmitting(false);
                return;
            }

            // 3. Authenticate with real credentials to establish cryptographic session cookie
            const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
                email: formData.email.trim().toLowerCase(),
                password: formData.password
            });

            if (loginError) {
                // If direct sign-in requires email verification:
                setRegistrationSuccess(true);
                setIsSubmitting(false);
                return;
            }

            // 4. Fetch Verified Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, role, email')
                .eq('id', authData.user.id)
                .single();

            const userState = {
                id: authData.user.id,
                email: authData.user.email,
                firstName: profile?.first_name || formData.firstName,
                lastName: profile?.last_name || formData.lastName,
                role: profile?.role || 'customer'
            };

            // 5. Store verified user and notify application
            localStorage.setItem('currentUser', JSON.stringify(userState));
            window.dispatchEvent(new Event('userStateChange'));

            setRegistrationSuccess(true);

            // 6. Hard redirect to flush session cookies through Next.js middleware
            setTimeout(() => {
                const params = new URLSearchParams(window.location.search);
                const redirect = params.get('redirect');
                const target = (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) ? redirect : '/account';
                window.location.assign(target);
            }, 1000);

        } catch (error) {
            console.error('Registration Error:', error);
            setExistingAccountError(error.message || 'Registration failed. Please try again.');
            triggerShake();
            setIsSubmitting(false);
        }
    };

    // --- REAL SUPABASE SOCIAL REGISTER ---
    const handleSocialRegister = async (platform) => {
        setIsSubmitting(true);
        try {
            const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
            const redirect = params?.get('redirect');
            const targetPath = (redirect && redirect.startsWith('/') && !redirect.startsWith('//'))
                ? redirect
                : '/account';
            const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(targetPath)}`;

            const { error } = await supabase.auth.signInWithOAuth({
                provider: platform.toLowerCase(),
                options: {
                    redirectTo: callbackUrl
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error('Social Login Error:', error.message);
            setIsSubmitting(false);
        }
    };

    return (
        <main className="animate-fade-in bg-white min-h-screen flex flex-col pb-20">

            {/* Minimalist Editorial Header */}
            <div className="pt-20 pb-10 text-center">
                <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-4 block">
                    New Customer
                </span>
                <h1 className="text-4xl md:text-5xl font-light text-stone-900 tracking-tight">
                    Create <span className="font-serif italic font-bold">Account</span>
                </h1>
            </div>

            {/* Register Content */}
            <div className="flex-grow flex items-start justify-center px-4 sm:px-6 lg:px-8 pt-4">
                <div className="max-w-lg w-full">

                    {registrationSuccess ? (
                        <div className="bg-stone-50 border border-stone-200/80 rounded-3xl p-10 text-center animate-fade-in shadow-xl shadow-stone-200/40">
                            <div className="inline-flex justify-center items-center w-16 h-16 bg-stone-900 rounded-full mb-6 shadow-lg shadow-stone-900/20 text-white">
                                <FiCheck size={28} />
                            </div>
                            <h3 className="text-2xl font-serif font-light text-stone-900 mb-2">Account Created</h3>
                            <p className="text-stone-500 mb-6 text-sm">Welcome to ShopHub! Setting up your secure session...</p>
                            <div className="flex items-center justify-center gap-2 text-xs font-bold tracking-widest uppercase text-stone-400">
                                <svg className="animate-spin h-3 w-3 text-stone-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Redirecting to Account
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Prominent Duplicate Email Warning Banner */}
                            {existingAccountError && (
                                <div className="mb-6 p-5 bg-rose-50 border border-rose-200/80 rounded-2xl animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <FiAlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-rose-900 uppercase tracking-wide">Account Already Exists</p>
                                            <p className="text-xs text-rose-700 mt-0.5">{existingAccountError}</p>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/login?email=${encodeURIComponent(formData.email)}${redirectParam ? `&redirect=${encodeURIComponent(redirectParam)}` : ''}`}
                                        className="shrink-0 px-4 py-2 bg-rose-900 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-rose-950 transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
                                    >
                                        Sign In Now <FiArrowRight />
                                    </Link>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className={shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                                    <div>
                                        <label htmlFor="firstName" className="block text-xs font-bold tracking-widest uppercase text-stone-900 mb-2">First Name</label>
                                        <input
                                            type="text" id="firstName" name="firstName"
                                            value={formData.firstName} onChange={handleInputChange}
                                            placeholder="First name" required disabled={isSubmitting}
                                            className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm"
                                        />
                                        {errors.firstName && <div className="mt-2 text-red-500 text-xs font-medium flex items-center gap-1"><FiAlertCircle /> {errors.firstName}</div>}
                                    </div>
                                    <div>
                                        <label htmlFor="lastName" className="block text-xs font-bold tracking-widest uppercase text-stone-900 mb-2">Last Name</label>
                                        <input
                                            type="text" id="lastName" name="lastName"
                                            value={formData.lastName} onChange={handleInputChange}
                                            placeholder="Last name" required disabled={isSubmitting}
                                            className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm"
                                        />
                                        {errors.lastName && <div className="mt-2 text-red-500 text-xs font-medium flex items-center gap-1"><FiAlertCircle /> {errors.lastName}</div>}
                                    </div>
                                </div>

                                <div className="mb-5">
                                    <label htmlFor="email" className="block text-xs font-bold tracking-widest uppercase text-stone-900 mb-2">Email Address</label>
                                    <input
                                        type="email" id="email" name="email"
                                        value={formData.email} onChange={handleInputChange}
                                        placeholder="Enter your email" required disabled={isSubmitting}
                                        className={`w-full px-5 py-3.5 bg-stone-50 border rounded-lg focus:outline-none transition-colors text-sm ${errors.email ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-stone-900 focus:bg-white'}`}
                                    />
                                    {errors.email && <div className="mt-2 text-red-500 text-xs font-medium flex items-center gap-1"><FiAlertCircle /> {errors.email}</div>}
                                </div>

                                <div className="mb-5">
                                    <label htmlFor="password" className="block text-xs font-bold tracking-widest uppercase text-stone-900 mb-2">Password</label>
                                    <input
                                        type="password" id="password" name="password"
                                        value={formData.password} onChange={handleInputChange}
                                        placeholder="Create a password" required disabled={isSubmitting}
                                        className={`w-full px-5 py-3.5 bg-stone-50 border rounded-lg focus:outline-none transition-colors text-sm ${errors.password ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-stone-900 focus:bg-white'}`}
                                    />
                                    <p className="mt-2 text-[11px] text-stone-400 leading-relaxed">
                                        Must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number.
                                    </p>
                                    {errors.password && <div className="mt-2 text-red-500 text-xs font-medium flex items-center gap-1"><FiAlertCircle /> {errors.password}</div>}
                                </div>

                                <div className="mb-6">
                                    <label htmlFor="confirmPassword" className="block text-xs font-bold tracking-widest uppercase text-stone-900 mb-2">Confirm Password</label>
                                    <input
                                        type="password" id="confirmPassword" name="confirmPassword"
                                        value={formData.confirmPassword} onChange={handleInputChange}
                                        placeholder="Confirm your password" required disabled={isSubmitting}
                                        className={`w-full px-5 py-3.5 bg-stone-50 border rounded-lg focus:outline-none transition-colors text-sm ${errors.confirmPassword ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-stone-900 focus:bg-white'}`}
                                    />
                                    {errors.confirmPassword && <div className="mt-2 text-red-500 text-xs font-medium flex items-center gap-1"><FiAlertCircle /> {errors.confirmPassword}</div>}
                                </div>

                                <div className="flex items-start mb-8">
                                    <div className="relative flex items-center mt-0.5">
                                        <input
                                            type="checkbox" id="terms" name="terms"
                                            checked={formData.terms} onChange={handleInputChange}
                                            required disabled={isSubmitting}
                                            className="peer h-4 w-4 appearance-none border border-stone-300 rounded-sm checked:bg-stone-900 checked:border-stone-900 transition-colors cursor-pointer"
                                        />
                                        <FiCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xs opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                    </div>
                                    <label htmlFor="terms" className="ml-3 block text-sm text-stone-600 leading-relaxed">
                                        I agree to the <Link href="/terms" className="text-stone-900 underline underline-offset-4">Terms of Service</Link> and <Link href="/privacy-policy" className="text-stone-900 underline underline-offset-4">Privacy Policy</Link>
                                    </label>
                                </div>
                                {errors.terms && <div className="mt-[-1rem] mb-6 text-red-500 text-xs font-medium flex items-center gap-1"><FiAlertCircle /> {errors.terms}</div>}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold tracking-widest uppercase text-xs py-4 rounded-full transition-colors flex justify-center items-center disabled:opacity-70 shadow-lg shadow-stone-900/20 mb-8"
                                >
                                    {isSubmitting ? (
                                        <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Creating Account...</>
                                    ) : 'Create Account'}
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="relative py-4 mb-6">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200"></div></div>
                                <div className="relative flex justify-center"><span className="bg-white px-4 text-xs font-bold tracking-widest uppercase text-stone-400">Or Continue With</span></div>
                            </div>

                            {/* Social Registration */}
                            <div className="space-y-3">
                                <button disabled={isSubmitting} onClick={() => handleSocialRegister('Google')} className="w-full flex items-center justify-center py-3.5 px-4 border border-stone-200 rounded-full hover:bg-stone-50 transition-colors text-sm font-medium text-stone-700 disabled:opacity-70">
                                    <FaGoogle className="mr-3 text-stone-600" /> Sign up with Google
                                </button>
                                <button disabled={isSubmitting} onClick={() => handleSocialRegister('Facebook')} className="w-full flex items-center justify-center py-3.5 px-4 border border-stone-200 rounded-full hover:bg-stone-50 transition-colors text-sm font-medium text-stone-700 disabled:opacity-70">
                                    <FaFacebookF className="mr-3 text-stone-600" /> Sign up with Facebook
                                </button>
                            </div>

                            {/* Login Link */}
                            <div className="mt-10 text-center">
                                <p className="text-sm text-stone-500">
                                    Already have an account?{' '}
                                    <Link href={redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'} className="font-bold text-stone-900 hover:text-stone-600 transition-colors border-b border-stone-900 pb-0.5">Sign in</Link>
                                </p>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </main>
    );
}