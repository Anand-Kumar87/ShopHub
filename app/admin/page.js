'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../utils/supabase';
import {
    FiGrid, FiBox, FiShoppingBag, FiUsers, FiTag,
    FiSettings, FiGift, FiGlobe, FiCircle, FiMail, FiLock
} from 'react-icons/fi';

import CurrencySelector from '../components/CurrencySelector';
import DashboardOverview from '../components/admin/DashboardOverview';
import ProductManagement from '../components/admin/ProductManagement';
import OrderTracking from '../components/admin/OrderTracking';
import CustomerDirectory from '../components/admin/CustomerDirectory';
import CategoryManagement from '../components/admin/CategoryManagement';
import CouponManagement from '../components/admin/CouponManagement';
import Inquiries from '../components/admin/Inquiries';
import GlobalSettings from '../components/admin/GlobalSettings';

const TABS = [
    { id: 'dashboard', label: 'Overview', icon: FiGrid },
    { id: 'products', label: 'Catalog', icon: FiBox },
    { id: 'orders', label: 'Orders', icon: FiShoppingBag },
    { id: 'customers', label: 'Clientele', icon: FiUsers },
    { id: 'categories', label: 'Collections', icon: FiTag },
    { id: 'coupons', label: 'Promo Codes', icon: FiGift },
    { id: 'messages', label: 'Inquiries', icon: FiMail },
    { id: 'settings', label: 'Settings', icon: FiSettings },
];

export default function AdminDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('dashboard');

    // 🔥 SUPER TRICK: Track which tabs the user has clicked
    const [visitedTabs, setVisitedTabs] = useState(['dashboard']);

    const [isAuthorized, setIsAuthorized] = useState(false);

    // Add newly clicked tab to the visited list so it stays alive
    useEffect(() => {
        if (!visitedTabs.includes(activeTab)) {
            setVisitedTabs(prev => [...prev, activeTab]);
        }
    }, [activeTab, visitedTabs]);

    // Security Gate
    useEffect(() => {
        const verifyAdmin = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.replace('/');
                    return;
                }
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                if (profile && profile.role === 'admin') {
                    setIsAuthorized(true);
                } else {
                    router.replace('/');
                }
            } catch (error) {
                console.error("Security verification failed:", error);
                router.replace('/');
            }
        };

        verifyAdmin();
    }, [router]);

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center animate-pulse">
                <FiLock className="text-stone-300 mb-4" size={48} />
                <p className="text-stone-500 font-bold tracking-widest uppercase text-xs">Verifying Security Credentials...</p>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen">
            <header className="bg-white border-b border-stone-200 px-6 py-5 flex justify-between items-center sticky top-0 z-30">
                <div className="flex items-center gap-6">
                    <Link href="/" className="text-xl font-light text-stone-900 tracking-tight">
                        ShopHub <span className="font-serif italic font-bold text-stone-400">Portal</span>
                    </Link>
                    <span className="hidden md:flex items-center gap-2 bg-green-50 text-green-700 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-green-100">
                        <FiCircle size={8} className="text-green-500 fill-current" /> Protected Live Sync
                    </span>
                </div>

                <div className="flex items-center gap-4 text-stone-500">
                    <div className="hidden sm:block mr-2 scale-90 origin-right">
                        <CurrencySelector />
                    </div>
                    <Link href="/" className="text-xs font-bold tracking-widest uppercase hover:text-stone-900 transition flex items-center gap-2">
                        <FiGlobe size={14} /> View Store
                    </Link>
                </div>
            </header>

            <main className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col md:flex-row gap-12">

                    <div className="md:w-1/4 lg:w-1/5">
                        <div className="sticky top-28 space-y-1">
                            <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-6 px-4">Navigation</p>
                            <nav className="space-y-1">
                                {TABS.map(tab => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`w-full flex items-center gap-4 text-left px-4 py-3.5 rounded-xl transition duration-300 font-medium text-sm ${activeTab === tab.id ? 'bg-stone-900 text-white font-bold tracking-widest uppercase text-xs' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'}`}
                                        >
                                            <Icon size={18} className={activeTab === tab.id ? 'text-white' : 'text-stone-400'} /> {tab.label}
                                        </button>
                                    )
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* 🔥 SMART RENDERING: Load once, hide with CSS, Never lose data! */}
                    <div className="md:w-3/4 lg:w-4/5 pb-24 relative">
                        <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
                            {visitedTabs.includes('dashboard') && <DashboardOverview setActiveTab={setActiveTab} />}
                        </div>
                        <div className={activeTab === 'products' ? 'block' : 'hidden'}>
                            {visitedTabs.includes('products') && <ProductManagement />}
                        </div>
                        <div className={activeTab === 'orders' ? 'block' : 'hidden'}>
                            {visitedTabs.includes('orders') && <OrderTracking />}
                        </div>
                        <div className={activeTab === 'customers' ? 'block' : 'hidden'}>
                            {visitedTabs.includes('customers') && <CustomerDirectory />}
                        </div>
                        <div className={activeTab === 'categories' ? 'block' : 'hidden'}>
                            {visitedTabs.includes('categories') && <CategoryManagement />}
                        </div>
                        <div className={activeTab === 'coupons' ? 'block' : 'hidden'}>
                            {visitedTabs.includes('coupons') && <CouponManagement />}
                        </div>
                        <div className={activeTab === 'messages' ? 'block' : 'hidden'}>
                            {visitedTabs.includes('messages') && <Inquiries />}
                        </div>
                        <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
                            {visitedTabs.includes('settings') && <GlobalSettings />}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
