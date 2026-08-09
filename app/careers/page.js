'use client';

import { useState, useEffect } from 'react';
import { FiBriefcase, FiMapPin, FiArrowRight } from 'react-icons/fi';

export default function CareersPage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                // Tries to fetch from your real backend API
                const res = await fetch('/api/careers');
                if (res.ok) {
                    const data = await res.json();
                    setJobs(data);
                } else {
                    throw new Error('API endpoint not ready yet');
                }
            } catch (error) {
                console.warn("Using fallback data until real API is connected.");
                // Premium Mock Data for Luxury Aesthetic
                setJobs([
                    { id: 1, title: 'Senior Art Director', department: 'Creative', location: 'Milan, Italy (Hybrid)', type: 'Full-time' },
                    { id: 2, title: 'E-commerce Concierge', department: 'Client Services', location: 'New York, USA', type: 'Full-time' },
                    { id: 3, title: 'Lead Frontend Engineer', department: 'Engineering', location: 'Remote', type: 'Full-time' },
                    { id: 4, title: 'Merchandising Specialist', department: 'Curation', location: 'Paris, France', type: 'Contract' },
                    { id: 5, title: 'Brand Marketing Manager', department: 'Marketing', location: 'London, UK', type: 'Full-time' }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    return (
        <main className="bg-white min-h-screen pb-24 animate-fade-in">

            {/* Minimalist Editorial Header */}
            <div className="bg-stone-50 pt-24 pb-20 border-b border-stone-200 px-4 mb-12">
                <div className="max-w-3xl mx-auto text-center">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-4 block">
                        Careers at ShopHub
                    </span>
                    <h1 className="text-4xl md:text-6xl font-light text-stone-900 tracking-tight mb-6">
                        Join Our <span className="font-serif italic font-bold">Team</span>
                    </h1>
                    <p className="text-stone-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                        We are continually seeking exceptional talent to help us redefine the digital luxury shopping experience. Discover our current openings below.
                    </p>
                </div>
            </div>

            {/* Job Board Section */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                {loading ? (
                    /* Premium Skeleton Loader */
                    <div className="animate-pulse space-y-0">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="py-8 border-b border-stone-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="space-y-4 w-full md:w-1/2">
                                    <div className="h-6 bg-stone-100 rounded w-3/4"></div>
                                    <div className="h-3 bg-stone-100 rounded w-1/2"></div>
                                </div>
                                <div className="h-10 bg-stone-100 rounded-full w-32"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Editorial Job List */
                    <div className="border-t border-stone-200">
                        {jobs.map(job => (
                            <div
                                key={job.id}
                                className="group py-8 md:py-10 border-b border-stone-200 hover:bg-stone-50/50 transition-colors duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 -mx-4 md:px-6 md:-mx-6 rounded-2xl md:rounded-none"
                            >
                                <div>
                                    <h2 className="text-xl md:text-2xl font-light text-stone-900 mb-3 group-hover:text-stone-600 transition-colors">
                                        {job.title}
                                    </h2>

                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                                        <span className="flex items-center text-[10px] font-bold tracking-widest uppercase text-stone-500">
                                            <FiBriefcase className="mr-2 text-stone-400" size={14} />
                                            {job.department}
                                        </span>
                                        <span className="flex items-center text-[10px] font-bold tracking-widest uppercase text-stone-500">
                                            <FiMapPin className="mr-2 text-stone-400" size={14} />
                                            {job.location}
                                        </span>
                                        <span className="text-[10px] font-bold tracking-widest uppercase text-stone-900 border border-stone-200 px-3 py-1 rounded-full bg-white">
                                            {job.type}
                                        </span>
                                    </div>
                                </div>

                                <button className="w-full md:w-auto inline-flex items-center justify-center gap-2 border border-stone-200 text-stone-900 text-[10px] font-bold tracking-widest uppercase px-8 py-3.5 rounded-full group-hover:bg-stone-900 group-hover:text-white group-hover:border-stone-900 transition-all duration-300">
                                    Apply Now <FiArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Open Application CTA */}
                {!loading && (
                    <div className="mt-20 text-center pt-10">
                        <p className="text-sm text-stone-500 mb-6">
                            Do not see a perfect fit? We are always open to meeting brilliant minds.
                        </p>
                        <a
                            href="mailto:careers@shophub.com"
                            className="text-xs font-bold tracking-widest uppercase text-stone-900 border-b border-stone-900 pb-0.5 hover:text-stone-500 hover:border-stone-500 transition-colors"
                        >
                            Submit Open Application
                        </a>
                    </div>
                )}

            </div>
        </main>
    );
}