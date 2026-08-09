'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiCheck, FiAlertCircle, FiX } from 'react-icons/fi';
import { FaGoogle, FaFacebookF } from 'react-icons/fa';
// Is se replace karein (using @ path jo Next.js mein best hota hai):
import { supabase } from '../utils/supabase';

export default function LoginPage() {
    const router = useRouter();

    // Core Login State
    const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
    const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState('');

    // Social Modals State
    const [activeModal, setActiveModal] = useState(null); // 'google-loading', 'facebook-loading', null

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // --- REAL SUPABASE EMAIL/PASSWORD LOGIN ---
    const handleStandardLogin = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        // Basic validation
        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
            setErrorMessage('Please enter a valid email address');
            setStatus('error');
            return;
        }
        if (!formData.password) {
            setErrorMessage('Please enter your password');
            setStatus('error');
            return;
        }

        setStatus('loading');

        try {
            // 1. Supabase Sign In
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (authError) throw authError;

            // 2. Fetch User Profile Data to check role (Admin vs Customer)
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('first_name, last_name, role, avatar_url')
                .eq('id', authData.user.id)
                .single();

            // 3. Save to localStorage for instant UI updates
            const userState = {
                id: authData.user.id,
                email: authData.user.email,
                firstName: profileData?.first_name || authData.user.email.split('@')[0],
                lastName: profileData?.last_name || '',
                role: profileData?.role || 'customer',
                image: profileData?.avatar_url || ''
            };

            localStorage.setItem('currentUser', JSON.stringify(userState));

            // THE FIX: Trigger event so Header updates instantly without reload
            window.dispatchEvent(new Event('userStateChange'));

            setStatus('success');

            // 4. Role-based redirect
            setTimeout(() => {
                if (userState.role === 'admin') {
                    router.push('/admin');
                } else {
                    router.push('/account');
                }
            }, 1500);

        } catch (error) {
            setErrorMessage(error.message || 'Invalid login credentials. Please try again.');
            setStatus('error');
        }
    };

    // --- REAL SUPABASE SOCIAL LOGIN ---
    const handleSocialLogin = async (platform) => {
        setActiveModal(`${platform.toLowerCase()}-loading`);

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: platform.toLowerCase(),
                options: {
                    // Redirect back to account page after successful Google/Facebook login
                    redirectTo: `${window.location.origin}/account`
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error('Social Login Error:', error.message);
            setErrorMessage(error.message);
            setStatus('error');
            setActiveModal(null);
        }
    };

    return (
        <main className="animate-fade-in bg-white min-h-screen flex flex-col pb-20">

            {/* Minimalist Editorial Header */}
            <div className="pt-20 pb-10 text-center">
                <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-4 block">
                    My Account
                </span>
                <h1 className="text-4xl md:text-5xl font-light text-stone-900 tracking-tight">
                    Welcome <span className="font-serif italic font-bold">Back</span>
                </h1>
            </div>

            {/* Login Content */}
            <div className="flex-grow flex items-start justify-center px-4 sm:px-6 lg:px-8 pt-4">
                <div className="max-w-md w-full">

                    {status !== 'success' ? (
                        <div className="animate-fade-in">
                            <form onSubmit={handleStandardLogin} className={status === 'error' ? 'animate-[shake_0.5s_ease-in-out]' : ''}>

                                <div className="mb-5">
                                    <label htmlFor="email" className="block text-xs font-bold tracking-widest uppercase text-stone-900 mb-2">Email Address</label>
                                    <input
                                        type="email" id="email" name="email"
                                        value={formData.email} onChange={handleInputChange}
                                        placeholder="Enter your email" disabled={status === 'loading'}
                                        className={`w-full px-5 py-3.5 bg-stone-50 border rounded-lg focus:outline-none transition-colors text-sm ${status === 'error' ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-stone-900 focus:bg-white'}`}
                                    />
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <label htmlFor="password" className="block text-xs font-bold tracking-widest uppercase text-stone-900">Password</label>
                                        <Link href="/forgot-password" className="text-xs text-stone-500 hover:text-stone-900 transition-colors underline underline-offset-4">Forgot?</Link>
                                    </div>
                                    <input
                                        type="password" id="password" name="password"
                                        value={formData.password} onChange={handleInputChange}
                                        placeholder="Enter your password" disabled={status === 'loading'}
                                        className={`w-full px-5 py-3.5 bg-stone-50 border rounded-lg focus:outline-none transition-colors text-sm tracking-widest ${status === 'error' ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-stone-900 focus:bg-white'}`}
                                    />
                                </div>

                                {status === 'error' && (
                                    <div className="mb-6 p-3 bg-red-50/50 text-red-600 rounded-lg text-xs font-medium flex items-center border border-red-100">
                                        <FiAlertCircle className="mr-2 text-red-500 text-sm" />
                                        {errorMessage}
                                    </div>
                                )}

                                <div className="flex items-center mb-8">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox" id="rememberMe" name="rememberMe"
                                            checked={formData.rememberMe} onChange={handleInputChange}
                                            className="peer h-4 w-4 appearance-none border border-stone-300 rounded-sm checked:bg-stone-900 checked:border-stone-900 transition-colors cursor-pointer"
                                        />
                                        <FiCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xs opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                    </div>
                                    <label htmlFor="rememberMe" className="ml-3 block text-sm text-stone-600 cursor-pointer hover:text-stone-900 transition-colors">Keep me signed in</label>
                                </div>

                                <button
                                    type="submit" disabled={status === 'loading'}
                                    className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold tracking-widest uppercase text-xs py-4 rounded-full transition-colors flex justify-center items-center disabled:opacity-70 shadow-lg shadow-stone-900/20 mb-8"
                                >
                                    {status === 'loading' ? (
                                        <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Signing in...</>
                                    ) : 'Sign In'}
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="relative py-4 mb-6">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200"></div></div>
                                <div className="relative flex justify-center"><span className="bg-white px-4 text-xs font-bold tracking-widest uppercase text-stone-400">Or Continue With</span></div>
                            </div>

                            {/* Real Social Login Buttons */}
                            <div className="space-y-3">
                                <button onClick={() => handleSocialLogin('Google')} className="w-full flex items-center justify-center py-3.5 px-4 border border-stone-200 rounded-full hover:bg-stone-50 transition-colors text-sm font-medium text-stone-700">
                                    <FaGoogle className="mr-3 text-stone-600" /> Google
                                </button>
                                <button onClick={() => handleSocialLogin('Facebook')} className="w-full flex items-center justify-center py-3.5 px-4 border border-stone-200 rounded-full hover:bg-stone-50 transition-colors text-sm font-medium text-stone-700">
                                    <FaFacebookF className="mr-3 text-stone-600" /> Facebook
                                </button>
                            </div>

                            {/* Register Link */}
                            <div className="mt-10 text-center">
                                <p className="text-sm text-stone-500">
                                    Don't have an account?{' '}
                                    <Link href="/register" className="font-bold text-stone-900 hover:text-stone-600 transition-colors border-b border-stone-900 pb-0.5">Create one</Link>
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* Success State */
                        <div className="bg-stone-50 border border-stone-100 rounded-3xl p-10 text-center animate-fade-in mt-4">
                            <div className="inline-flex justify-center items-center w-16 h-16 bg-stone-900 rounded-full mb-6 shadow-xl shadow-stone-900/20">
                                <FiCheck className="text-3xl text-white" />
                            </div>
                            <h3 className="text-2xl font-light text-stone-900 mb-2">Login Successful</h3>
                            <p className="text-stone-500 mb-6 text-sm">Welcome back, <span className="font-bold text-stone-900">{formData.email}</span></p>
                            <div className="flex items-center justify-center gap-2 text-xs font-bold tracking-widest uppercase text-stone-400">
                                <svg className="animate-spin h-3 w-3 text-stone-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Redirecting
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Social Loading Modal */}
            {(activeModal === 'google-loading' || activeModal === 'facebook-loading') && (
                <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-xs w-full text-center border border-stone-100">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-900 mx-auto mb-5"></div>
                        <p className="text-stone-900 font-bold tracking-widest uppercase text-xs">Redirecting to Provider...</p>
                    </div>
                </div>
            )}
        </main>
    );
}