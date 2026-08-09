'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import Link from 'next/link';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

export default function Error({ error, reset }) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application Error:', error);
    }, [error]);

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 animate-fade-in py-16">
            <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 text-center relative overflow-hidden">

                {/* Background decoration */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-orange-400"></div>

                {/* Icon */}
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiAlertTriangle className="w-10 h-10" />
                </div>

                {/* Message */}
                <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
                    Something went wrong!
                </h1>
                <p className="text-gray-500 mb-8 leading-relaxed">
                    We apologize for the inconvenience. An unexpected error has occurred in our system. Our technical team has been notified.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => reset()}
                        className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg"
                    >
                        <FiRefreshCw className="text-lg" /> Try Again
                    </button>

                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 bg-gray-50 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-100 text-gray-700 font-bold py-3.5 px-8 rounded-xl transition-all"
                    >
                        <FiHome className="text-lg" /> Go Home
                    </Link>
                </div>

                <div className="mt-8 text-sm text-gray-400">
                    Error Code: {error?.digest || '500_INTERNAL_SERVER_ERROR'}
                </div>
            </div>
        </main>
    );
}