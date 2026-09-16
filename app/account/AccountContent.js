'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { supabase } from '../utils/supabase';
import { useGlobalCurrency } from '../context/CurrencyContext';
import { useWishlist } from '../context/WishlistContext';
import toast from 'react-hot-toast';
import {
    FiUser, FiShoppingBag, FiSettings, FiHeart, FiLogOut,
    FiX, FiCheck, FiPrinter, FiTruck, FiTag, FiGift, FiClock
} from 'react-icons/fi';

const COUNTRY_MAP = {
    'IN': 'India', 'US': 'United States', 'GB': 'United Kingdom', 'CA': 'Canada',
    'AU': 'Australia', 'FR': 'France', 'DE': 'Germany', 'IT': 'Italy',
    'ES': 'Spain', 'NL': 'Netherlands', 'SE': 'Sweden', 'CH': 'Switzerland',
    'AE': 'United Arab Emirates', 'SG': 'Singapore', 'JP': 'Japan',
    'NZ': 'New Zealand', 'ZA': 'South Africa', 'MX': 'Mexico', 'BR': 'Brazil',
    'ROW': 'Rest of the World'
};

const safePrice = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
};

const safeDate = (dateString) => {
    if (!dateString) return 'Pending / Not Set';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? 'Pending / Not Set' : d.toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    }).toUpperCase();
};

const getExpectedDelivery = (orderDateString, currentStatus) => {
    if (currentStatus === 'Delivered') return 'Delivered successfully';
    if (currentStatus === 'Cancelled') return 'Order Cancelled';
    if (!orderDateString) return 'Calculating...';
    const orderDate = new Date(orderDateString);
    if (isNaN(orderDate.getTime())) return 'Calculating...';
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + 5);
    return `Expected by ${deliveryDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} (2:00 PM - 7:00 PM)`;
};

// 🔥 Fetches everything the account page needs in one shot. Defined at
// module scope (like fetchCategories/fetchProducts on the shop page) so
// SWR's cache key stays stable — this is what lets a return visit to
// /account reuse cached data instantly instead of re-querying Supabase.
const fetchAccountData = async () => {
    let { data: { session } } = await supabase.auth.getSession();

    // 🔥 FIX: on a hard reload, the Supabase client is sometimes still
    // restoring the session from storage when this fires, causing a
    // false "logged out" read. Give it one short retry before giving up.
    if (!session) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        ({ data: { session } } = await supabase.auth.getSession());
    }

    if (!session) return null; // caller redirects to /login

    const [profRes, ordRes, coupRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        // 🔥 FIX: { count: 'exact' } returns the TRUE total matching rows
        // separately from `data`, so the "Total Orders" stat isn't capped
        // by the .limit(15) used for the Recent Purchases preview list.
        supabase.from('orders').select('*', { count: 'exact' }).eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(15),
        supabase.from('coupons').select('*')
    ]);

    return {
        id: session.user.id,
        email: session.user.email,
        firstName: profRes.data?.first_name || '',
        lastName: profRes.data?.last_name || '',
        role: profRes.data?.role || 'customer',
        orders: ordRes.data || [],
        totalOrders: ordRes.count ?? (ordRes.data || []).length,
        coupons: coupRes.data || []
    };
};

export default function AccountContent({ serverUser, serverOrders, serverCoupons }) {
    const router = useRouter();
    const { currency, convertPrice } = useGlobalCurrency() || { currency: 'USD', convertPrice: (v) => `$${v}` };
    const { wishlistItems } = useWishlist() || { wishlistItems: [] };

    // 🔥 Same initial value on server AND client (fixes a hydration
    // mismatch — reading localStorage inside a useState initializer meant
    // the client's very first render differed from the server's HTML).
    const [user, setUser] = useState(serverUser || {});
    const [orders, setOrders] = useState(serverOrders || []);
    const [totalOrders, setTotalOrders] = useState(serverOrders?.length || 0);
    const [coupons, setCoupons] = useState(serverCoupons || []);
    const [mounted, setMounted] = useState(false);

    // 🔥 0ms LOCAL CACHE LOAD — moved into an effect (runs client-only,
    // right after mount/hydration) so it can no longer cause a mismatch.
    useEffect(() => {
        setMounted(true);
        try {
            const cachedUser = localStorage.getItem('currentUser');
            if (cachedUser) setUser(JSON.parse(cachedUser));
        } catch (e) { }
        try {
            const cachedOrders = localStorage.getItem('shophub_db_orders');
            if (cachedOrders) setOrders(JSON.parse(cachedOrders));
        } catch (e) { }
    }, []);

    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [trackingOrder, setTrackingOrder] = useState(null);

    const [accountForm, setAccountForm] = useState({
        firstName: user?.firstName || '', lastName: user?.lastName || '', email: user?.email || '',
        currentPassword: '', newPassword: '', confirmPassword: ''
    });

    // 🔥 SWR handles the actual network call — dedupingInterval means a
    // return visit to /account within 5 minutes reuses this cached result
    // instantly instead of re-querying Supabase, which is what fixes the
    // "reloads every time I come back from Wishlist" problem.
    const { data: swrAccount } = useSWR('account_data', fetchAccountData, {
        revalidateOnFocus: false,
        dedupingInterval: 5 * 60 * 1000
    });

    // 🔥 URL Tab Sync & Navigation Handler
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        if (tabParam && ['dashboard', 'overview', 'orders', 'rewards', 'account'].includes(tabParam)) {
            setActiveTab(tabParam === 'overview' ? 'dashboard' : tabParam);
        } else if (urlParams.get('viewOrder')) {
            setActiveTab('orders');
            window.history.replaceState(null, '', window.location.pathname);
        }
    }, []);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            if (tabId === 'dashboard') {
                url.searchParams.delete('tab');
            } else {
                url.searchParams.set('tab', tabId);
            }
            window.history.replaceState({}, '', url.toString());
        }
    };

    useEffect(() => {
        if (swrAccount === undefined) return; // still loading

        if (swrAccount === null) {
            router.push('/login');
            return;
        }

        const existingUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const updatedUser = {
            ...existingUser,
            id: swrAccount.id,
            email: swrAccount.email,
            firstName: swrAccount.firstName || existingUser.firstName || '',
            lastName: swrAccount.lastName || existingUser.lastName || '',
            role: swrAccount.role || existingUser.role || 'customer'
        };

        setUser(updatedUser);
        try { localStorage.setItem('currentUser', JSON.stringify(updatedUser)); } catch (e) { }

        setAccountForm(prev => ({ ...prev, firstName: updatedUser.firstName, lastName: updatedUser.lastName, email: updatedUser.email }));

        setOrders(swrAccount.orders);
        try { localStorage.setItem('shophub_db_orders', JSON.stringify(swrAccount.orders)); } catch (error) { }
        setTotalOrders(swrAccount.totalOrders ?? swrAccount.orders.length);

        setCoupons(swrAccount.coupons);
    }, [swrAccount, router]);

    // 🔥 REAL REWARDS ENGINE
    const { rewards, couponsCount } = useMemo(() => {
        if (!coupons || coupons.length === 0) return { rewards: [], couponsCount: 0 };

        const sortedCoupons = [...coupons].sort((a, b) => a.discount - b.discount);
        const orderCount = totalOrders;
        const generatedRewards = [];

        if (sortedCoupons[0]) generatedRewards.push({ ...sortedCoupons[0], title: 'Welcome Client Bonus', description: 'Enjoy this exclusive reward off your next curation.' });
        if (orderCount >= 1 && sortedCoupons[1]) generatedRewards.push({ ...sortedCoupons[1], title: 'Elite Client Status', description: 'A special tier discount as a token of our appreciation.' });
        if (orderCount >= 5 && sortedCoupons[2]) generatedRewards.push({ ...sortedCoupons[2], title: 'Maison VIP Reward', description: 'Our highest tier discount for your exquisite taste.' });

        return { rewards: generatedRewards, couponsCount: generatedRewards.length };
    }, [totalOrders, coupons]);

    // Live Order Updates
    useEffect(() => {
        if (!user?.id) return;
        const channel = supabase.channel(`live-orders-${user.id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, payload => {
                setOrders(curr => {
                    const updated = curr.map(o => o.id === payload.new.id ? payload.new : o);
                    try { localStorage.setItem('shophub_db_orders', JSON.stringify(updated.slice(0, 15))); } catch (e) { }
                    return updated;
                });
                setSelectedOrder(curr => curr?.id === payload.new.id ? payload.new : curr);
            }).subscribe();

        return () => supabase.removeChannel(channel);
    }, [user?.id]);

    useEffect(() => {
        if (selectedOrder || trackingOrder) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [selectedOrder, trackingOrder]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('currentUser');
        localStorage.removeItem('shophub_db_orders');
        window.dispatchEvent(new Event('userStateChange'));
        router.push('/login');
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Promo code copied to clipboard!');
    };

    const handleAccountSubmit = async (e) => {
        e.preventDefault();
        if (accountForm.newPassword && accountForm.newPassword !== accountForm.confirmPassword) {
            toast.error('New passwords do not match.');
            return;
        }

        try {
            await supabase.auth.updateUser({
                data: { first_name: accountForm.firstName, last_name: accountForm.lastName, full_name: `${accountForm.firstName} ${accountForm.lastName}`.trim() }
            });

            const { data: updatedProfile, error: profError } = await supabase
                .from('profiles')
                .update({ first_name: accountForm.firstName, last_name: accountForm.lastName })
                .eq('id', user.id)
                .select()
                .single();

            if (profError) throw profError;

            if (accountForm.newPassword) {
                const { error: pwdError } = await supabase.auth.updateUser({ password: accountForm.newPassword });
                if (pwdError) throw pwdError;
            }

            const updatedUser = { ...user, firstName: updatedProfile.first_name, lastName: updatedProfile.last_name };
            setUser(updatedUser);
            try { localStorage.setItem('currentUser', JSON.stringify(updatedUser)); } catch (e) { }

            setAccountForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
            toast.success('Profile preferences updated successfully.');
        } catch (error) {
            toast.error(error.message || 'Failed to sync with server.');
        }
    };

    const cancelOrder = async (orderId) => {
        if (window.confirm('Cancel this order?')) {
            const { error } = await supabase.from('orders').update({ status: 'Cancelled' }).eq('id', orderId);
            if (!error) {
                const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: 'Cancelled' } : o);
                setOrders(updatedOrders);
                setSelectedOrder(updatedOrders.find(o => o.id === orderId));
                try { localStorage.setItem('shophub_db_orders', JSON.stringify(updatedOrders.slice(0, 15))); } catch (e) { }
                toast.success('Order cancelled successfully.');
            }
        }
    };

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered': return 'bg-stone-900 text-white';
            case 'shipped': return 'bg-stone-200 text-stone-800';
            case 'processing': return 'bg-stone-100 text-stone-600';
            case 'cancelled': return 'bg-red-50 text-red-600';
            default: return 'bg-stone-100 text-stone-600';
        }
    };

    const formatDisplayId = (order) => {
        if (!order) return '';
        if (order.orderNumber) return order.orderNumber;
        if (order.id) return order.id.toString().startsWith('ORD-') ? order.id : `ORD-${order.id.substring(0, 8).toUpperCase()}`;
        return 'PENDING';
    };

    const localWishlist = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('shophub_wishlist') || '[]') : [];
    const actualWishlistCount = wishlistItems?.length || localWishlist.length || 0;

    const TABS = [
        { id: 'dashboard', label: 'Overview', icon: FiUser },
        { id: 'orders', label: 'Order History', icon: FiShoppingBag },
        { id: 'rewards', label: 'My Rewards', icon: FiGift },
        { id: 'account', label: 'Account Details', icon: FiSettings },
    ];

    return (
        <main className="animate-fade-in bg-white min-h-screen pb-24">
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 10mm 15mm;
                    }
                    html, body {
                        height: auto !important;
                        min-height: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                        overflow: visible !important;
                    }
                    /* Completely isolate print portal by hiding all sibling body nodes */
                    body > *:not(#print-receipt-portal) {
                        display: none !important;
                    }
                    #print-receipt-portal {
                        display: block !important;
                        position: static !important;
                        width: 100% !important;
                        height: auto !important;
                        min-height: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                        overflow: visible !important;
                        backdrop-filter: none !important;
                        -webkit-backdrop-filter: none !important;
                    }
                    #print-receipt-portal * {
                        visibility: visible !important;
                    }
                    .print-container {
                        position: static !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        height: auto !important;
                        max-height: none !important;
                        overflow: visible !important;
                        box-shadow: none !important;
                        border: 1px solid #e7e5e4 !important;
                        border-radius: 12px !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: #ffffff !important;
                    }
                    .print-scroll-fix {
                        overflow: visible !important;
                        max-height: none !important;
                        height: auto !important;
                        padding: 24px !important;
                        display: block !important;
                    }
                    .print-item-row {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="bg-stone-50 pt-24 pb-16 border-b border-stone-200 px-4 mb-12 no-print">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2 block">Client Portal</span>
                        <h1 className="text-4xl md:text-5xl font-light text-stone-900 tracking-tight">
                            My <span className="font-serif italic font-bold">Account</span>
                        </h1>
                    </div>
                    <button onClick={handleSignOut} className="text-xs font-bold tracking-widest uppercase text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-2">
                        <FiLogOut size={14} /> Sign Out
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 no-print">
                <div className="flex flex-col lg:flex-row gap-12">
                    <div className="lg:w-1/4">
                        <div className="sticky top-24 space-y-1">
                            <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-6 px-4">Navigation</p>
                            {TABS.map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`w-full text-left px-4 py-3.5 text-sm transition-colors flex items-center gap-4 rounded-xl ${activeTab === tab.id ? 'bg-stone-900 text-white font-bold tracking-widest uppercase text-xs' : 'text-stone-500 hover:bg-stone-50 font-medium hover:text-stone-900'}`}>
                                        <Icon size={18} className={activeTab === tab.id ? 'text-white' : 'text-stone-400'} /> {tab.label}
                                    </button>
                                );
                            })}
                            <Link href="/wishlist" className="w-full text-left px-4 py-3.5 text-sm transition-colors flex items-center gap-4 rounded-xl text-stone-500 hover:bg-stone-50 font-medium hover:text-stone-900">
                                <FiHeart size={18} className="text-stone-400" /> Wishlist
                            </Link>
                            {user?.role === 'admin' && (
                                <Link href="/admin" className="w-full text-left px-4 py-3.5 text-sm transition-colors flex items-center gap-4 rounded-xl text-stone-500 hover:bg-stone-50 font-medium hover:text-stone-900 mt-4 border border-stone-100">
                                    <FiSettings size={18} className="text-stone-400" /> Admin Dashboard
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="lg:w-3/4">
                        {activeTab === 'dashboard' && (
                            <div className="animate-fade-in space-y-12">
                                <div>
                                    <h2 className="text-2xl font-light text-stone-900 mb-6">Welcome, {user?.firstName || 'User'}</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        <div className="border border-stone-200 rounded-2xl p-8 text-center hover:border-stone-900 transition-colors group cursor-pointer" onClick={() => handleTabChange('orders')}>
                                            <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-stone-900 group-hover:text-white transition-colors">
                                                <FiShoppingBag size={20} />
                                            </div>
                                            <div className="text-3xl font-light text-stone-900 mb-1">{totalOrders}</div>
                                            <div className="text-[10px] font-bold tracking-widest uppercase text-stone-400">Total Orders</div>
                                        </div>
                                        <Link href="/wishlist" className="border border-stone-200 rounded-2xl p-8 text-center hover:border-stone-900 transition-colors group cursor-pointer">
                                            <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-stone-900 group-hover:text-white transition-colors">
                                                <FiHeart size={20} />
                                            </div>
                                            <div className="text-3xl font-light text-stone-900 mb-1">{actualWishlistCount}</div>
                                            <div className="text-[10px] font-bold tracking-widest uppercase text-stone-400">Saved Items</div>
                                        </Link>
                                        <div className="border border-stone-200 rounded-2xl p-8 text-center hover:border-stone-900 transition-colors group cursor-pointer" onClick={() => handleTabChange('rewards')}>
                                            <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-stone-900 group-hover:text-white transition-colors">
                                                <FiTag size={20} />
                                            </div>
                                            <div className="text-3xl font-light text-stone-900 mb-1">{couponsCount}</div>
                                            <div className="text-[10px] font-bold tracking-widest uppercase text-stone-400">Active Rewards</div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-light text-stone-900">Recent Purchases</h3>
                                        <button onClick={() => handleTabChange('orders')} className="text-xs font-bold tracking-widest uppercase text-stone-500 hover:text-stone-900 border-b border-transparent hover:border-stone-900 transition-colors">View All</button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="border-b-2 border-stone-900">
                                                    <th className="py-4 pr-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Order</th>
                                                    <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Date</th>
                                                    <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Status</th>
                                                    <th className="py-4 pl-4 font-bold tracking-widest uppercase text-[10px] text-stone-400 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-stone-600">
                                                {orders.slice(0, 3).map((order, idx) => (
                                                    <tr key={order.id || idx} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                                        <td className="py-5 pr-4 font-medium text-stone-900">{formatDisplayId(order)}</td>
                                                        <td className="py-5 px-4">{safeDate(order.created_at || order.date)}</td>
                                                        <td className="py-5 px-4"><span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${getStatusClass(order.status)}`}>{order.status || 'Processing'}</span></td>
                                                        <td className="py-5 pl-4 text-right font-medium text-stone-900">{convertPrice(safePrice(order.total_amount || order.total || order.totals?.total))}</td>
                                                    </tr>
                                                ))}
                                                {orders.length === 0 && <tr><td colSpan="4" className="py-8 text-center text-stone-400 text-sm">No recent orders found. Time to shop!</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'rewards' && (
                            <div className="animate-fade-in space-y-8">
                                <h2 className="text-2xl font-light text-stone-900 border-b border-stone-200 pb-4">My <span className="font-serif italic font-bold">Rewards</span></h2>
                                {rewards.length === 0 ? (
                                    <div className="text-center py-16 border border-dashed border-stone-200 rounded-2xl">
                                        <FiGift className="mx-auto text-stone-300 mb-4" size={32} />
                                        <p className="text-sm text-stone-500 font-bold mb-1">No active rewards yet.</p>
                                        <p className="text-xs text-stone-400">Place your first order to unlock exclusive discounts!</p>
                                        <button onClick={() => router.push('/shop')} className="mt-6 bg-stone-900 text-white text-xs font-bold tracking-widest uppercase px-8 py-3 rounded-full hover:bg-stone-800 transition-colors">Start Shopping</button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {rewards.map((reward, i) => (
                                            <div key={reward.id || i} className="relative overflow-hidden bg-stone-900 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-shadow">
                                                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
                                                <div className="relative z-10">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"><FiGift size={18} className="text-white" /></div>
                                                        <span className="bg-white text-stone-900 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">{reward.type === 'percent' ? `${reward.discount}% OFF` : `${convertPrice(reward.discount)} OFF`}</span>
                                                    </div>
                                                    <h3 className="text-lg font-bold mb-1">{reward.title}</h3>
                                                    <p className="text-xs text-stone-300 mb-6">{reward.description}</p>
                                                    <div className="bg-white/10 border border-white/20 rounded-lg p-3 flex justify-between items-center backdrop-blur-sm">
                                                        <span className="font-mono font-bold tracking-wider text-sm">{reward.code}</span>
                                                        <button onClick={() => copyToClipboard(reward.code)} className="text-[10px] uppercase tracking-widest font-bold hover:text-stone-300 transition-colors flex items-center gap-1">Copy</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div className="animate-fade-in">
                                <h2 className="text-2xl font-light text-stone-900 mb-8">Order History</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b-2 border-stone-900">
                                                <th className="py-4 pr-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Order</th>
                                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Date</th>
                                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Status</th>
                                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400 text-right">Total</th>
                                                <th className="py-4 pl-4 font-bold tracking-widest uppercase text-[10px] text-stone-400 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-stone-600">
                                            {orders.map((order, idx) => (
                                                <tr key={order.id || idx} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                                    <td className="py-5 pr-4 font-medium text-stone-900">{formatDisplayId(order)}</td>
                                                    <td className="py-5 px-4">{safeDate(order.created_at || order.date)}</td>
                                                    <td className="py-5 px-4"><span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${getStatusClass(order.status)}`}>{order.status || 'Processing'}</span></td>
                                                    <td className="py-5 px-4 text-right font-medium text-stone-900">{convertPrice(safePrice(order.total_amount || order.total || order.totals?.total))}</td>
                                                    <td className="py-5 pl-4 text-right">
                                                        <button onClick={() => setSelectedOrder(order)} className="text-xs font-bold tracking-widest uppercase text-stone-500 hover:text-stone-900 transition-colors border-b border-stone-300 pb-0.5 hover:border-stone-900">View</button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {orders.length === 0 && <tr><td colSpan="5" className="py-16 text-center text-stone-400 text-sm">No orders found. Your history will appear here.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'account' && (
                            <div className="animate-fade-in max-w-2xl">
                                <h2 className="text-2xl font-light text-stone-900 mb-8">Personal Information</h2>
                                <form onSubmit={handleAccountSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">First Name</label>
                                            <input type="text" value={accountForm.firstName} onChange={(e) => setAccountForm({ ...accountForm, firstName: e.target.value })} required className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Last Name</label>
                                            <input type="text" value={accountForm.lastName} onChange={(e) => setAccountForm({ ...accountForm, lastName: e.target.value })} required className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Email Address</label>
                                        <input type="email" value={accountForm.email} onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })} required disabled className="w-full px-5 py-3.5 bg-stone-100 border border-transparent rounded-lg text-sm text-stone-500 cursor-not-allowed" />
                                    </div>
                                    <div className="pt-8 border-t border-stone-200 mt-8">
                                        <h3 className="text-lg font-light text-stone-900 mb-6">Security</h3>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Current Password</label>
                                                <input type="password" value={accountForm.currentPassword} onChange={(e) => setAccountForm({ ...accountForm, currentPassword: e.target.value })} className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">New Password</label>
                                                    <input type="password" value={accountForm.newPassword} onChange={(e) => setAccountForm({ ...accountForm, newPassword: e.target.value })} className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Confirm Password</label>
                                                    <input type="password" value={accountForm.confirmPassword} onChange={(e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })} className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-6">
                                        <button type="submit" className="w-full sm:w-auto bg-stone-900 text-white text-xs font-bold tracking-widest uppercase px-10 py-4 rounded-full hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/10">Save Preferences</button>
                                    </div>
                                </form>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {mounted && selectedOrder && createPortal(
                <div
                    id="print-receipt-portal"
                    className="fixed inset-0 z-[999999] overflow-y-auto bg-stone-900/70 backdrop-blur-md p-3 sm:p-6 md:p-8 flex items-center justify-center animate-fade-in print-wrapper min-h-screen"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setSelectedOrder(null);
                    }}
                >
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col border border-stone-100 print-container my-auto overflow-hidden relative">
                        <div className="px-6 sm:px-8 py-5 border-b border-stone-100 flex justify-between items-center bg-stone-50/80 flex-shrink-0">
                            <div>
                                <div className="hidden print:block mb-1">
                                    <span className="text-xl font-bold tracking-tight text-stone-900">ShopHub.</span>
                                    <span className="text-xs text-stone-500 ml-2">Official Tax Invoice & Receipt</span>
                                </div>
                                <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-0.5">Order Receipt</p>
                                <h3 className="text-xl sm:text-2xl font-light text-stone-900">{formatDisplayId(selectedOrder)}</h3>
                            </div>
                            <div className="flex items-center gap-3 no-print">
                                <button
                                    onClick={() => window.print()}
                                    title="Print Receipt"
                                    className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors shadow-sm"
                                >
                                    <FiPrinter size={16} />
                                </button>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    title="Close"
                                    className="w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center hover:bg-stone-800 transition-colors shadow-sm"
                                >
                                    <FiX size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8 overflow-y-auto flex-1 min-h-0 space-y-8 print-scroll-fix">
                            <div className="flex flex-wrap items-center justify-between gap-6 print-item-row">
                                <div><p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-1">Date</p><p className="text-sm font-medium text-stone-900">{safeDate(selectedOrder.created_at || selectedOrder.date)}</p></div>
                                <div><p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-1">Payment Method</p><p className="text-sm font-medium text-stone-900 flex items-center gap-2"><span className="uppercase tracking-widest text-[11px] font-bold">{selectedOrder.payment_method || 'Standard'}</span><span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${selectedOrder.paymentStatus?.toLowerCase() === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{selectedOrder.paymentStatus || 'Pending'}</span></p></div>
                                <div><p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-1">Status</p><span className={`px-3 py-1 inline-flex text-[10px] font-bold uppercase tracking-widest rounded-full ${getStatusClass(selectedOrder.status)}`}>{selectedOrder.status || 'Processing'}</span></div>
                                {selectedOrder.status !== 'Cancelled' && (
                                    <button onClick={() => { setSelectedOrder(null); setTrackingOrder(selectedOrder); }} className="bg-stone-900 text-white hover:bg-stone-800 px-6 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase transition-colors flex items-center gap-2 shadow-md no-print"><FiTruck size={14} /> Track Order</button>
                                )}
                            </div>

                            <div className="print-item-row">
                                <h4 className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-4 border-b border-stone-200 pb-2">Purchased Items</h4>
                                <div className="space-y-4">
                                    {(selectedOrder.items || []).map((item, idx) => (
                                        <div key={idx} className="flex gap-4 print-item-row">
                                            <div className="w-16 h-20 bg-stone-100 rounded-lg overflow-hidden border border-stone-100 flex-shrink-0"><img src={item.image || item.images?.[0]} alt={item.name} className="w-full h-full object-cover" /></div>
                                            <div className="flex-1 py-1">
                                                <p className="font-bold text-sm text-stone-900 line-clamp-1 mb-1">{item.name}</p>
                                                <p className="text-xs text-stone-500 uppercase tracking-widest mb-1">Qty: {item.quantity || 1}</p>
                                                <p className="font-medium text-sm text-stone-900">{convertPrice(safePrice(item.price))}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-stone-100 print-item-row">
                                <div>
                                    <h4 className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-3">Delivery Details</h4>
                                    <p className="text-sm text-stone-600 leading-relaxed bg-stone-50 p-5 rounded-xl border border-stone-100">
                                        {selectedOrder.shippingAddress || selectedOrder.shipping?.address || selectedOrder.shipping_address?.street ? (
                                            <><span className="font-bold text-stone-900 block mb-1">Destination</span>{selectedOrder.shippingAddress || selectedOrder.shipping?.address || selectedOrder.shipping_address?.street}<br />{selectedOrder.city || selectedOrder.shipping?.city || selectedOrder.shipping_address?.city}, {selectedOrder.state || selectedOrder.shipping?.state || selectedOrder.shipping_address?.state} {selectedOrder.postalCode || selectedOrder.shipping?.postalCode || selectedOrder.shipping_address?.zipCode}<br />{COUNTRY_MAP[selectedOrder.country || selectedOrder.shipping?.country || selectedOrder.shipping_address?.country] || (selectedOrder.country || selectedOrder.shipping?.country || selectedOrder.shipping_address?.country)}</>
                                        ) : "Address details pending."}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-3">Summary</h4>
                                    <div className="space-y-3 text-sm bg-stone-50 p-5 rounded-xl border border-stone-100">
                                        <div className="flex justify-between text-stone-500"><span>Subtotal</span><span className="font-medium text-stone-900">{convertPrice(safePrice(selectedOrder.subtotal || selectedOrder.totals?.subtotal))}</span></div>
                                        {(safePrice(selectedOrder.totals?.discount) > 0 || selectedOrder.coupon) && (
                                            <div className="flex justify-between text-green-600 animate-fade-in"><span>Discount {selectedOrder.coupon ? `(${selectedOrder.coupon})` : ''}</span><span className="font-bold">-{convertPrice(safePrice(selectedOrder.totals?.discount))}</span></div>
                                        )}
                                        <div className="flex justify-between text-stone-500"><span>Shipping</span><span className="font-medium text-stone-900">{convertPrice(safePrice(selectedOrder.shipping || selectedOrder.totals?.shipping))}</span></div>
                                        <div className="flex justify-between text-stone-500"><span>Tax</span><span className="font-medium text-stone-900">{convertPrice(safePrice(selectedOrder.tax || selectedOrder.totals?.tax))}</span></div>
                                        <div className="flex justify-between pt-3 border-t border-stone-200 mt-2 font-bold"><span className="text-stone-900">Total</span><span className="text-stone-900">{convertPrice(safePrice(selectedOrder.total_amount || selectedOrder.total || selectedOrder.totals?.total))}</span></div>
                                    </div>
                                </div>
                            </div>

                            {selectedOrder.status === 'Processing' && (
                                <div className="flex justify-end pt-4 no-print"><button onClick={() => cancelOrder(selectedOrder.id)} className="text-red-500 hover:text-red-700 text-xs font-bold tracking-widest uppercase border-b border-transparent hover:border-red-700 pb-0.5 transition-colors">Request Cancellation</button></div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {mounted && trackingOrder && createPortal(
                <div
                    className="fixed inset-0 z-[999999] overflow-y-auto bg-stone-900/70 backdrop-blur-md p-4 flex items-center justify-center animate-fade-in no-print min-h-screen"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setTrackingOrder(null);
                    }}
                >
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[88vh] flex flex-col overflow-hidden border border-stone-100 my-auto relative">
                        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50 flex-shrink-0">
                            <h3 className="text-lg font-light text-stone-900">Track Journey</h3>
                            <button onClick={() => setTrackingOrder(null)} className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors"><FiX size={16} /></button>
                        </div>
                        <div className="p-8 overflow-y-auto flex-1 min-h-0">
                            <div className="flex justify-between items-start mb-8 border-b border-stone-100 pb-6">
                                <div><p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-1">Tracking Number</p><span className="text-stone-900 font-bold tracking-wider">TRK{trackingOrder.id?.toString().substring(0, 8).toUpperCase()}</span></div>
                                <div className="text-right bg-green-50 px-4 py-2 rounded-xl border border-green-100"><p className="text-[10px] font-bold tracking-widest uppercase text-green-600 mb-0.5 flex items-center gap-1"><FiClock size={10} /> Live Estimate</p><span className="text-green-800 font-medium text-xs">{getExpectedDelivery(trackingOrder.created_at || trackingOrder.date, trackingOrder.status)}</span></div>
                            </div>
                            <div className="relative border-l-2 border-stone-100 ml-2.5 space-y-10 pb-4">
                                <div className="relative pl-8">
                                    <div className="absolute w-4 h-4 bg-stone-900 rounded-full -left-[9px] top-0 ring-4 ring-white flex items-center justify-center"><FiCheck size={10} className="text-white" /></div>
                                    <h4 className="text-sm font-bold text-stone-900 mb-1">Order Confirmed</h4>
                                    <p className="text-xs text-stone-500 mb-1">We've received your order securely.</p>
                                    <p className="text-[10px] text-stone-400 font-mono">{safeDate(trackingOrder.created_at || trackingOrder.date)}</p>
                                </div>
                                <div className="relative pl-8">
                                    <div className={`absolute w-4 h-4 rounded-full -left-[9px] top-0 ring-4 ring-white flex items-center justify-center ${['Processing', 'Shipped', 'Delivered'].includes(trackingOrder.status) ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-400'}`}>
                                        {['Shipped', 'Delivered'].includes(trackingOrder.status) ? <FiCheck size={10} /> : <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse"></div>}
                                    </div>
                                    <h4 className={`text-sm font-bold mb-1 ${['Processing', 'Shipped', 'Delivered'].includes(trackingOrder.status) ? 'text-stone-900' : 'text-stone-400'}`}>Processing in Warehouse</h4>
                                    <p className="text-xs text-stone-500">Quality check and premium packaging in progress.</p>
                                </div>
                                <div className="relative pl-8">
                                    <div className={`absolute w-4 h-4 rounded-full -left-[9px] top-0 ring-4 ring-white flex items-center justify-center ${['Shipped', 'Delivered'].includes(trackingOrder.status) ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-400'}`}>
                                        {trackingOrder.status === 'Delivered' ? <FiCheck size={10} /> : <FiTruck size={8} />}
                                    </div>
                                    <h4 className={`text-sm font-bold mb-1 ${['Shipped', 'Delivered'].includes(trackingOrder.status) ? 'text-stone-900' : 'text-stone-400'}`}>Dispatched</h4>
                                    <p className="text-xs text-stone-500">Handed over to our delivery partner.</p>
                                </div>
                                <div className="relative pl-8">
                                    <div className={`absolute w-4 h-4 rounded-full -left-[9px] top-0 ring-4 ring-white flex items-center justify-center ${trackingOrder.status === 'Delivered' ? 'bg-green-500 text-white' : 'bg-stone-200 text-stone-400'}`}>
                                        <FiCheck size={10} />
                                    </div>
                                    <h4 className={`text-sm font-bold mb-1 ${trackingOrder.status === 'Delivered' ? 'text-green-600' : 'text-stone-400'}`}>Delivered</h4>
                                    <p className="text-xs text-stone-500">Your curated items have arrived.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </main>
    );
}