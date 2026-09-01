'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { useGlobalCurrency } from '../../context/CurrencyContext';
import toast from 'react-hot-toast';
import {
    FiX, FiCreditCard, FiSmartphone, FiBriefcase
} from 'react-icons/fi';

// Country Name Mapper
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
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    }).toUpperCase();
};

export default function OrderTracking() {
    const { convertPrice } = useGlobalCurrency() || { convertPrice: (val) => `₹${val}` };

    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal States
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // 🔥 1. Fetch Data SAFELY (No 500 or 400 Errors)
    useEffect(() => {
        let orderSubscription = null;

        const fetchOrders = async () => {
            setIsLoading(true);
            try {
                // सिर्फ select('*') का इस्तेमाल किया है, order() हटा दिया है ताकि 500 एरर ना आए
                const { data, error } = await supabase
                    .from('orders')
                    .select('*');

                if (data && !error) {
                    // JavaScript में सॉर्टिंग की है ताकि डेटाबेस क्रैश न हो
                    const sortedOrders = data.sort((a, b) => {
                        const dateA = new Date(a.created_at || a.orderDate || a.date || 0);
                        const dateB = new Date(b.created_at || b.orderDate || b.date || 0);
                        return dateB - dateA;
                    });
                    setOrders(sortedOrders);
                }

                // 🔥 REAL-TIME SYNC
                orderSubscription = supabase.channel(`live-orders-${Date.now()}`)
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
                        if (payload.eventType === 'INSERT') setOrders(prev => [payload.new, ...prev]);
                        else if (payload.eventType === 'UPDATE') setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
                        else if (payload.eventType === 'DELETE') setOrders(prev => prev.filter(o => o.id !== payload.old.id));
                    }).subscribe();

            } catch (error) {
                console.error("Order Fetch Error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();

        return () => {
            if (orderSubscription) supabase.removeChannel(orderSubscription);
        };
    }, []);

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': case 'delivered': case 'paid': return 'bg-stone-900 text-white';
            case 'draft': case 'cancelled': case 'unpaid': return 'bg-stone-200 text-stone-500';
            case 'shipped': case 'refunded': return 'bg-stone-500 text-white';
            default: return 'bg-stone-100 text-stone-900';
        }
    };

    const getPaymentIcon = (method) => {
        switch (method?.toLowerCase()) {
            case 'upi': return <FiSmartphone size={14} />;
            case 'bank': return <FiBriefcase size={14} />;
            default: return <FiCreditCard size={14} />;
        }
    };

    const openOrderModal = (order) => {
        setSelectedOrder(order);
        setIsOrderModalOpen(true);
    };

    const updateOrderStatus = async (orderId, field, newValue) => {
        if (!orderId) return toast.error("Unable to update: Missing Order Reference");

        setOrders(prevOrders => prevOrders.map(o =>
            (o.id === orderId || o.orderNumber === orderId) ? { ...o, [field]: newValue } : o
        ));

        if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.orderNumber === orderId)) {
            setSelectedOrder(prev => ({ ...prev, [field]: newValue }));
        }

        const { error } = await supabase.from('orders').update({ [field]: newValue }).eq('id', orderId);
        if (error) {
            console.error('Failed to update DB', error);
            toast.error("Failed to update status in database.");
        } else {
            toast.success("Status updated live!");
        }
    };

    if (isLoading) {
        return <div className="text-stone-400 text-sm animate-pulse pt-10">Syncing Live Orders...</div>;
    }

    return (
        <> {/* 🔥 FIX: Fragment added to isolate the modal from the animated div */}
            <div className="animate-fade-in space-y-8">
                <h2 className="text-2xl font-light text-stone-900 border-b border-stone-200 pb-4">Live Order <span className="font-serif italic font-bold">Tracking</span></h2>

                <div className="overflow-x-auto pb-10">
                    <table className="min-w-full text-left text-sm">
                        <thead>
                            <tr className="border-b-2 border-stone-900">
                                <th className="py-4 pr-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Order Ref</th>
                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Client</th>
                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Date</th>
                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Total</th>
                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Payment</th>
                                <th className="py-4 pl-4 font-bold tracking-widest uppercase text-[10px] text-stone-400 text-right">Status / Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-stone-600">
                            {orders.map((order, index) => {
                                const orderKey = order.id || order.orderNumber || `order-${index}`;
                                const customerName = order.customerName || (order.shipping ? `${order.shipping.firstName || ''} ${order.shipping.lastName || ''}`.trim() : null) || 'Online User';
                                const orderDateDisplay = order.created_at || order.orderDate || order.date;
                                const orderTotal = safePrice(order.total_amount || order.totals?.total || order.total);
                                const rawId = order.orderNumber || order.id?.toString();
                                const displayId = rawId ? (rawId.startsWith('ORD-') ? rawId : `ORD-${rawId.substring(0, 6).toUpperCase()}`) : 'PENDING';

                                return (
                                    <tr key={orderKey} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                        <td className="py-5 pr-4 font-bold text-stone-900 text-xs">{displayId}</td>
                                        <td className="py-5 px-4">{customerName}</td>
                                        <td className="py-5 px-4">{safeDate(orderDateDisplay)}</td>
                                        <td className="py-5 px-4 font-bold text-stone-900">{convertPrice(orderTotal)}</td>
                                        <td className="py-5 px-4">
                                            <div className="flex items-center gap-2">
                                                {getPaymentIcon(order.payment_method || order.payment?.method)}
                                                <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded ${getStatusStyle(order.paymentStatus || 'Unpaid')}`}>
                                                    {order.paymentStatus || 'Unpaid'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-5 pl-4 text-right flex items-center justify-end gap-3">
                                            <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full inline-block ${getStatusStyle(order.status)}`}>
                                                {order.status || 'Processing'}
                                            </span>
                                            <button
                                                onClick={() => openOrderModal(order)}
                                                className="text-[10px] font-bold tracking-widest uppercase text-stone-500 hover:text-stone-900 border-b border-stone-300 pb-0.5 hover:border-stone-900 transition-colors"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center py-10 text-stone-400 text-sm">Waiting for new orders...</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 🔥 FIX: ORDER PREVIEW MODAL PLACED OUTSIDE ANIMATED DIV */}
            {isOrderModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-[100] flex items-start justify-center p-4 pt-16 animate-fade-in overflow-y-auto pb-24 custom-scrollbar">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
                        <div className="px-8 py-5 border-b border-stone-100 flex justify-between items-center bg-stone-50/50 sticky top-0 z-10">
                            <div>
                                <h3 className="text-xl font-light text-stone-900">
                                    Order <span className="font-serif italic font-bold">#{selectedOrder.orderNumber || selectedOrder.id?.toString().substring(0, 8).toUpperCase()}</span>
                                </h3>
                                <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mt-1">
                                    {safeDate(selectedOrder.created_at || selectedOrder.date || selectedOrder.orderDate)}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsOrderModalOpen(false)}
                                className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors shadow-sm"
                            >
                                <FiX size={18} />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-8 hide-scrollbar grid grid-cols-1 lg:grid-cols-3 gap-10">

                            <div className="lg:col-span-2 space-y-8">
                                <div>
                                    <h4 className="text-[10px] font-bold tracking-widest uppercase text-stone-900 border-b border-stone-200 pb-2 mb-4">Items Purchased</h4>
                                    <div className="space-y-4">
                                        {(selectedOrder.items || []).map((item, idx) => (
                                            <div key={idx} className="flex gap-4">
                                                <div className="w-16 h-20 bg-stone-100 rounded-lg overflow-hidden border border-stone-100 flex-shrink-0">
                                                    <img src={item.image || item.images?.[0]} className="w-full h-full object-cover" alt="" />
                                                </div>
                                                <div className="flex-1 py-1">
                                                    <p className="font-bold text-sm text-stone-900 line-clamp-1">{item.name}</p>
                                                    <p className="text-xs text-stone-500 uppercase tracking-widest mb-1 mt-0.5">Qty: {item.quantity || 1}</p>
                                                    <p className="font-medium text-sm text-stone-900">{convertPrice(safePrice(item.price))}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-stone-100">
                                    <div>
                                        <h4 className="text-[10px] font-bold tracking-widest uppercase text-stone-900 border-b border-stone-200 pb-2 mb-3">Client Info</h4>
                                        <p className="text-sm font-bold text-stone-900 mb-1">
                                            {selectedOrder.customerName || (selectedOrder.shipping && selectedOrder.shipping.firstName ? `${selectedOrder.shipping.firstName} ${selectedOrder.shipping.lastName || ''}` : 'Online User')}
                                        </p>
                                        <p className="text-xs text-stone-500">
                                            {selectedOrder.email || selectedOrder.shipping?.email || selectedOrder.contactEmail || 'No email provided'}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-bold tracking-widest uppercase text-stone-900 border-b border-stone-200 pb-2 mb-3">Shipping Address</h4>
                                        <p className="text-xs text-stone-600 leading-relaxed">
                                            {selectedOrder.shippingAddress || selectedOrder.shipping_address?.street || selectedOrder.shipping?.address || 'No address provided'} <br />
                                            {selectedOrder.city || selectedOrder.shipping_address?.city || selectedOrder.shipping?.city}, {selectedOrder.state || selectedOrder.shipping_address?.state || selectedOrder.shipping?.state} {selectedOrder.postalCode || selectedOrder.shipping_address?.zipCode || selectedOrder.shipping?.postalCode} <br />
                                            {COUNTRY_MAP[selectedOrder.country || selectedOrder.shipping_address?.country || selectedOrder.shipping?.country] || (selectedOrder.country || selectedOrder.shipping_address?.country || selectedOrder.shipping?.country)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                                    <h4 className="text-[10px] font-bold tracking-widest uppercase text-stone-900 border-b border-stone-200 pb-2 mb-4">Financial Summary</h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between text-stone-500">
                                            <span>Subtotal</span>
                                            <span className="font-medium text-stone-900">{convertPrice(safePrice(selectedOrder.totals?.subtotal || selectedOrder.subtotal))}</span>
                                        </div>

                                        {(safePrice(selectedOrder.totals?.discount) > 0 || selectedOrder.coupon) && (
                                            <div className="flex justify-between text-green-600 animate-fade-in">
                                                <span>Discount {selectedOrder.coupon ? `(${selectedOrder.coupon})` : ''}</span>
                                                <span className="font-bold">-{convertPrice(safePrice(selectedOrder.totals?.discount))}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between text-stone-500">
                                            <span>Shipping</span>
                                            <span className="font-medium text-stone-900">{convertPrice(safePrice(selectedOrder.totals?.shipping || selectedOrder.shipping))}</span>
                                        </div>
                                        <div className="flex justify-between text-stone-500">
                                            <span>Tax</span>
                                            <span className="font-medium text-stone-900">{convertPrice(safePrice(selectedOrder.totals?.tax || selectedOrder.tax))}</span>
                                        </div>
                                        <div className="flex justify-between pt-3 border-t border-stone-200 mt-2 font-bold text-base">
                                            <span className="text-stone-900">Total</span>
                                            <span className="text-stone-900">{convertPrice(safePrice(selectedOrder.totals?.total || selectedOrder.total_amount || selectedOrder.total))}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Logistics Status</label>
                                        <select
                                            value={selectedOrder.status || 'Processing'}
                                            onChange={(e) => updateOrderStatus(selectedOrder.id || selectedOrder.orderNumber, 'status', e.target.value)}
                                            className="w-full px-4 py-3 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm font-bold text-stone-900"
                                        >
                                            <option value="Processing">Processing</option>
                                            <option value="Shipped">Shipped</option>
                                            <option value="Delivered">Delivered</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Payment Status</label>
                                        <select
                                            value={selectedOrder.paymentStatus || 'Unpaid'}
                                            onChange={(e) => updateOrderStatus(selectedOrder.id || selectedOrder.orderNumber, 'paymentStatus', e.target.value)}
                                            className="w-full px-4 py-3 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm font-bold text-stone-900"
                                        >
                                            <option value="Unpaid">Unpaid</option>
                                            <option value="Paid">Mark as Paid</option>
                                            <option value="Refunded">Refunded</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <div className="bg-white border border-stone-200 p-4 rounded-xl mt-4">
                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-1">Payment Method Used</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            {getPaymentIcon(selectedOrder.payment_method || selectedOrder.payment?.method)}
                                            <span className="text-sm font-bold text-stone-900 uppercase tracking-widest">
                                                {selectedOrder.payment_method || selectedOrder.payment?.method || 'Standard'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}