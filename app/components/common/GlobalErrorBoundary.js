'use client';

import React from 'react';
import { captureException } from '../../utils/logger';

export default class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            incidentId: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        // Report to centralized telemetry backend
        captureException(error, {
            componentStack: errorInfo?.componentStack,
            metadata: { boundary: 'GlobalErrorBoundary' }
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[500px] flex items-center justify-center p-6 bg-stone-50/50">
                    <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200/80 shadow-2xl shadow-stone-200/50 text-center">
                        <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-stone-700">
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-stone-400 block mb-2">
                            Observability Incident Captured
                        </span>

                        <h2 className="text-2xl font-serif font-light tracking-tight text-stone-900 mb-3">
                            Something went <span className="italic">unexpected.</span>
                        </h2>

                        <p className="text-stone-500 text-xs leading-relaxed mb-6 font-light">
                            Our real-time telemetry captured this issue and our engineering team has been notified.
                            You may restore your session or navigate to the catalog.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="px-6 py-2.5 bg-stone-900 text-white text-xs uppercase tracking-wider font-semibold rounded-full hover:bg-black transition-all shadow-md active:scale-95"
                            >
                                Try Again
                            </button>
                            <a
                                href="/"
                                className="px-6 py-2.5 bg-stone-100 text-stone-700 text-xs uppercase tracking-wider font-semibold rounded-full hover:bg-stone-200 transition-all active:scale-95"
                            >
                                Return Home
                            </a>
                        </div>

                        {process.env.NODE_ENV !== 'production' && this.state.error && (
                            <div className="mt-6 pt-4 border-t border-stone-100 text-left">
                                <details className="text-[11px] text-stone-500 font-mono">
                                    <summary className="cursor-pointer font-semibold text-rose-600 mb-2">
                                        Debug Error Details
                                    </summary>
                                    <div className="p-3 bg-stone-900 text-stone-100 rounded-xl overflow-x-auto text-[10px] max-h-48">
                                        <p className="font-bold text-rose-400 mb-1">{this.state.error.toString()}</p>
                                        <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                                    </div>
                                </details>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
