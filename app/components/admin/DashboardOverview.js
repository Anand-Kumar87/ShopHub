'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../utils/supabase';
import { useGlobalCurrency } from '../../context/CurrencyContext';
import {
    FiBox, FiShoppingBag, FiUsers, FiTag, FiTruck, FiTrendingUp, FiClock
} from 'react-icons/fi';

const safePrice = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
};

export default function DashboardOverview({ setActiveTab }) {
    const { convertPrice } = useGlobalCurrency() || { convertPrice: (val) => `₹${val}` };

    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 🔥 BUG FIX: INDEPENDENT FETCHING (No more random 0s)
    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                // Fetching independently. If one delays, others won't turn to 0.
                const { data: prodData } = await supabase.from('products').select('*');
                if (prodData) setProducts(prodData);

                const { data: ordData } = await supabase.from('orders').select('*');
                if (ordData) setOrders(ordData);

                const { data: profData } = await supabase.from('profiles').select('*');
                const { data: custData } = await supabase.from('customers').select('*');

                const emails = new Set();
                if (profData) profData.forEach(p => p.email && emails.add(p.email));
                if (custData) custData.forEach(c => c.email && emails.add(c.email));
                if (ordData) ordData.forEach(o => {
                    const em = o.email || o.shipping?.email;
                    if (em) emails.add(em);
                });
                setCustomers(Array.from(emails));

            } catch (error) {
                console.error("Dashboard Stats Fetch Error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Exact calculations based on your DB schema[cite: 2]
    const totalStock = useMemo(() => {
        return products.reduce((sum, p) => sum + (p.stock || 0), 0);
    }, [products]);

    const totalRevenue = useMemo(() => {
        return orders.reduce((sum, order) => sum + safePrice(order.total_amount || order.totals?.total), 0);
    }, [orders]);

    const totalTaxCollected = useMemo(() => {
        return orders.reduce((sum, order) => sum + safePrice(order.totals?.tax), 0);
    }, [orders]);

    const totalShippingCollected = useMemo(() => {
        return orders.reduce((sum, order) => sum + safePrice(order.totals?.shipping), 0);
    }, [orders]);

    // 🔥 NEW CARD 1: Average Order Value
    const averageOrderValue = useMemo(() => {
        if (orders.length === 0) return 0;
        return totalRevenue / orders.length;
    }, [totalRevenue, orders.length]);

    // 🔥 NEW CARD 2: Pending Orders to Fulfill
    const pendingOrdersCount = useMemo(() => {
        return orders.filter(o => o.status === 'Processing' || !o.status).length;
    }, [orders]);

    if (isLoading) {
        return <div className="text-stone-400 text-sm animate-pulse pt-10">Calculating Overview Analytics...</div>;
    }

    return (
        <div className="space-y-12 animate-fade-in">
            <div className="flex flex-wrap justify-between items-end gap-4">
                <h2 className="text-3xl font-light text-stone-900">Dashboard <span className="font-serif italic font-bold">Overview</span></h2>
            </div>

            {/* Now a perfect 8-card grid (2 rows of 4) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* 1. Products */}
                <div
                    onClick={() => setActiveTab('products')}
                    className="bg-stone-50 rounded-3xl p-8 border border-stone-100 group cursor-pointer hover:border-stone-900 hover:shadow-lg transition-all"
                >
                    <FiBox size={24} className="text-stone-400 mb-6 group-hover:text-stone-900 transition-colors" />
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-4xl font-light text-stone-900 mb-1">{products.length}</h3>
                        <span className="text-sm font-bold text-stone-400">({totalStock} pcs)</span>
                    </div>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Active Pieces & Stock</p>
                </div>

                {/* 2. Total Orders */}
                <div
                    onClick={() => setActiveTab('orders')}
                    className="bg-stone-50 rounded-3xl p-8 border border-stone-100 group cursor-pointer hover:border-stone-900 hover:shadow-lg transition-all"
                >
                    <FiShoppingBag size={24} className="text-stone-400 mb-6 group-hover:text-stone-900 transition-colors" />
                    <h3 className="text-4xl font-light text-stone-900 mb-1">{orders.length}</h3>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Total Orders</p>
                </div>

                {/* 3. Clientele */}
                <div
                    onClick={() => setActiveTab('customers')}
                    className="bg-stone-50 rounded-3xl p-8 border border-stone-100 group cursor-pointer hover:border-stone-900 hover:shadow-lg transition-all"
                >
                    <FiUsers size={24} className="text-stone-400 mb-6 group-hover:text-stone-900 transition-colors" />
                    <h3 className="text-4xl font-light text-stone-900 mb-1">{customers.length}</h3>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Unique Clientele</p>
                </div>

                {/* 4. Gross Revenue */}
                <div className="bg-stone-50 rounded-3xl p-8 border border-stone-100 group">
                    <FiTag size={24} className="text-stone-400 mb-6 group-hover:text-stone-900 transition-colors" />
                    <h3 className="text-3xl font-light text-stone-900 mb-1 truncate">{convertPrice(totalRevenue)}</h3>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Gross Revenue</p>
                </div>

                {/* 🔥 5. Average Order Value (NEW) */}
                <div className="bg-stone-50 rounded-3xl p-8 border border-stone-100 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <FiTrendingUp size={24} className="text-blue-400 mb-6 relative z-10 group-hover:text-blue-600 transition-colors" />
                    <h3 className="text-3xl font-light text-stone-900 mb-1 truncate relative z-10">{convertPrice(averageOrderValue)}</h3>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-stone-500 relative z-10">Avg. Order Value</p>
                </div>

                {/* 🔥 6. Pending Orders (NEW) */}
                <div
                    onClick={() => setActiveTab('orders')}
                    className="bg-stone-50 rounded-3xl p-8 border border-stone-100 group cursor-pointer hover:border-orange-200 hover:shadow-lg transition-all relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <FiClock size={24} className="text-orange-400 mb-6 relative z-10 group-hover:text-orange-600 transition-colors" />
                    <h3 className="text-4xl font-light text-stone-900 mb-1 relative z-10">{pendingOrdersCount}</h3>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-stone-500 relative z-10">Pending Fulfillment</p>
                </div>

                {/* 7. Shipping Collected */}
                <div className="bg-stone-50 rounded-3xl p-8 border border-stone-100 group">
                    <FiTruck size={24} className="text-stone-400 mb-6 group-hover:text-stone-900 transition-colors" />
                    <h3 className="text-3xl font-light text-stone-900 mb-1 truncate">{convertPrice(totalShippingCollected)}</h3>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Shipping Collected</p>
                </div>

                {/* 8. Tax Collected */}
                <div className="bg-stone-50 rounded-3xl p-8 border border-stone-100 group">
                    <FiTag size={24} className="text-stone-400 mb-6 group-hover:text-stone-900 transition-colors" />
                    <h3 className="text-3xl font-light text-stone-900 mb-1 truncate">{convertPrice(totalTaxCollected)}</h3>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Tax Collected</p>
                </div>

            </div>
        </div>
    );
}