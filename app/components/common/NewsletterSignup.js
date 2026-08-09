'use client';

import { useState } from 'react';
import { FiCheck, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitted(true);
      setEmail('');
      toast.success('Welcome to the club!', {
        icon: '✨',
        style: { background: '#1c1917', color: '#fff' }
      });
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-stone-950 text-white rounded-3xl overflow-hidden shadow-2xl my-8">
      <div className="px-6 py-16 md:py-24 md:px-16 max-w-5xl mx-auto relative flex flex-col items-center text-center">

        {/* Subtle Decorative Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-800/40 via-stone-950/0 to-transparent pointer-events-none"></div>

        {submitted ? (
          <div className="flex flex-col items-center animate-fade-in relative z-10 max-w-md">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-white/10">
              <FiCheck size={28} className="text-stone-900" />
            </div>
            <h3 className="text-3xl md:text-4xl font-light mb-4 tracking-tight">
              Welcome to the <span className="font-serif italic font-bold">List</span>
            </h3>
            <p className="text-stone-400 text-sm md:text-base leading-relaxed">
              You've successfully subscribed. Keep an eye on your inbox for exclusive early access to our new collections and styling curations.
            </p>
          </div>
        ) : (
          <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center">

            <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-6">
              Become an Insider
            </span>

            <h3 className="text-3xl md:text-5xl font-light mb-4 tracking-tight">
              Join the <span className="font-serif italic font-bold">Club</span>
            </h3>

            <p className="text-stone-400 text-sm md:text-base mb-10 max-w-md">
              Stay curated. Subscribe for exclusive early access to new arrivals, sales, and styling tips directly to your inbox.
            </p>

            <form onSubmit={handleSubmit} className="w-full max-w-md">
              <div className="relative flex items-center bg-stone-900/80 border border-stone-800 rounded-full overflow-hidden focus-within:border-stone-500 transition-colors p-1.5 shadow-inner">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full bg-transparent text-white placeholder-stone-500 px-6 py-3.5 focus:outline-none text-sm"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-white text-stone-900 px-6 py-3.5 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-stone-200 transition-colors focus:outline-none disabled:opacity-70 flex items-center justify-center min-w-[120px]"
                >
                  {loading ? (
                    <svg className="animate-spin h-4 w-4 text-stone-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : (
                    <span className="flex items-center gap-2">Subscribe <FiArrowRight /></span>
                  )}
                </button>
              </div>

              {/* Error Message */}
              <div className="h-6 mt-3">
                {error && <p className="text-red-400 text-xs font-medium animate-fade-in">{error}</p>}
              </div>
            </form>

          </div>
        )}
      </div>
    </div>
  );
}