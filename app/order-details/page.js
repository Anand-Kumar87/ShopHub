"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    FiArrowLeft,
    FiAlertCircle,
    FiTruck,
    FiFileText,
    FiHeadphones,
    FiPhone,
    FiMail,
    FiClock,
    FiCheck,
    FiPackage,
    FiCreditCard
} from 'react-icons/fi';

export default function OrderDetailsPage() {
    const [mounted, setMounted] = useState(false);
    const [orderData, setOrderData] = useState(null);

    // Hydration & Data Loading
    useEffect(() => {
        setMounted(true);
        try {
            const savedOrder = localStorage.getItem('shophub_order');
            if (savedOrder) {
                setOrderData(JSON.parse(savedOrder));
            }
        } catch (error) {
            console.error('Error loading order data:', error);
        }
    }, []);

    // Load Demo Data for Testing
    const loadDemoOrder = () => {
        const demoOrder = {
            orderNumber: 'SHP-847291',
            orderDate: new Date().toISOString(),
            status: 'Processing',
            items: [
                { name: 'Minimalist Stone Vase', price: 89.00, quantity: 1, image: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=400&q=80' },
                { name: 'Linen Blend Throw', price: 125.00, quantity: 2, image: 'https://images.unsplash.com/photo-1580828325281-b5860d70eb06?auto=format&fit=crop&w=400&q=80' }
            ],
            shipping: { firstName: 'Elena', lastName: 'Rossi', email: 'elena@example.com', phone: '+1 234 567 890', address: '124 Luxury Ave, Suite 4B', city: 'Milan', state: 'Lombardy', postalCode: '20121', country: 'Italy' },
            payment: { method: 'credit-card' },
            totals: { subtotal: 339.00, shipping: 0, tax: 28.50, total: 367.50 }
        };
        setOrderData(demoOrder);
        localStorage.setItem('shophub_order', JSON.stringify(demoOrder));
    };

    // Formatters
    const formatCurrency = (amount) => `$${parseFloat(amount).toFixed(2)}`;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getEstimatedDelivery = (dateString) => {
        const deliveryDate = new Date(dateString);
        deliveryDate.setDate(deliveryDate.getDate() + 5);
        return `${deliveryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    };

    const getStatusStyle = (status) => {
        const normalizedStatus = (status || 'processing').toLowerCase();
        switch (normalizedStatus) {
            case 'delivered': return 'bg-stone-900 text-white';
            case 'shipped': return 'bg-stone-200 text-stone-800';
            case 'cancelled': return 'bg-red-50 text-red-600';
            default: return 'bg-stone-100 text-stone-600'; // processing
        }
    };

    const getPaymentMethodName = (method) => {
        const methods = {
            'credit-card': 'Credit Card',
            'paypal': 'PayPal',
            'bank-transfer': 'Bank Transfer'
        };
        return methods[method] || method;
    };

    // Handlers for sidebar actions
    const handleTrackOrder = () => alert('Tracking system integration pending. Status: PROCESSING');
    const handleDownloadInvoice = () => alert('Generating high-res PDF invoice...');
    const handleContactSupport = () => window.location.href = `mailto:concierge@shophub.com?subject=Inquiry regarding Order ${orderData?.orderNumber}`;

    // Prevent hydration mismatch
    if (!mounted) return null;

    return (
        <main className="animate-fade-in bg-white min-h-screen pb-24">

            {/* Minimalist Editorial Header */}
            <div className="bg-stone-50 pt-24 pb-12 border-b border-stone-200 px-4">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2 block">
                            Order Summary
                        </span>
                        <h1 className="text-4xl font-light text-stone-900 tracking-tight">
                            Order <span className="font-serif italic font-bold">Details</span>
                        </h1>
                    </div>
                    <Link href="/account" className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-stone-500 hover:text-stone-900 transition-colors border-b border-transparent hover:border-stone-900 pb-0.5">
                        <FiArrowLeft size={14} /> Back to Account
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">

                {/* Not Found State */}
                {!orderData ? (
                    <div className="animate-fade-in text-center py-20 max-w-md mx-auto">
                        <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-400">
                            <FiPackage size={24} />
                        </div>
                        <h2 className="text-2xl font-light text-stone-900 mb-3">No Order Found</h2>
                        <p className="text-sm text-stone-500 mb-8 leading-relaxed">
                            We couldn't find the details for this order. It might have been cleared from your local session.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button onClick={loadDemoOrder} className="w-full bg-stone-900 text-white text-xs font-bold tracking-widest uppercase px-8 py-4 rounded-full hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/10">
                                Load Demo Order
                            </button>
                            <Link href="/shop" className="w-full bg-white text-stone-900 border border-stone-200 text-xs font-bold tracking-widest uppercase px-8 py-4 rounded-full hover:bg-stone-50 transition-colors">
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                ) : (

                    /* Order Details Content */
                    <div className="lg:flex lg:gap-12 items-start animate-fade-in">

                        {/* Main Order Information */}
                        <div className="lg:w-2/3 space-y-12">

                            {/* Order Info Header */}
                            <div>
                                <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
                                    <div>
                                        <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Order Number</p>
                                        <h2 className="text-2xl font-light text-stone-900">{orderData.orderNumber}</h2>
                                        <p className="text-sm text-stone-500 mt-1">Placed on {formatDate(orderData.orderDate)}</p>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${getStatusStyle(orderData.status)}`}>
                                        {orderData.status || 'Processing'}
                                    </div>
                                </div>

                                {/* Delivery Estimate Banner */}
                                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 flex items-start gap-4">
                                    <div className="mt-0.5 text-stone-900">
                                        <FiTruck size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold tracking-widest uppercase text-stone-900 mb-1">Estimated Delivery</h3>
                                        <p className="text-sm text-stone-600 font-serif italic">Arriving by {getEstimatedDelivery(orderData.orderDate)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div>
                                <h3 className="text-sm font-bold tracking-widest uppercase text-stone-900 mb-6 border-b border-stone-200 pb-4">Purchased Items</h3>
                                <div className="space-y-6">
                                    {orderData.items.map((item, idx) => (
                                        <div key={idx} className="flex gap-6 group">
                                            {/* Premium 3:4 Image */}
                                            <div className="relative w-20 sm:w-24 aspect-[3/4] rounded-lg overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-200/60">
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                                                />
                                            </div>
                                            <div className="flex-grow flex flex-col justify-center">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-stone-900 mb-1">{item.name}</h4>
                                                        <p className="text-xs text-stone-500 uppercase tracking-wider">Qty: {item.quantity}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-stone-900">{formatCurrency(item.price * item.quantity)}</p>
                                                        {item.quantity > 1 && (
                                                            <p className="text-[10px] text-stone-400 mt-1">{formatCurrency(item.price)} each</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Shipping Information */}
                            <div>
                                <h3 className="text-sm font-bold tracking-widest uppercase text-stone-900 mb-6 border-b border-stone-200 pb-4">Shipping Details</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-6 bg-stone-50/50 p-8 rounded-2xl border border-stone-100">
                                    <div>
                                        <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Recipient</p>
                                        <p className="text-sm text-stone-900">{orderData.shipping.firstName} {orderData.shipping.lastName}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Contact</p>
                                        <p className="text-sm text-stone-900">{orderData.shipping.email}</p>
                                        <p className="text-sm text-stone-900 mt-0.5">{orderData.shipping.phone}</p>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Delivery Address</p>
                                        <p className="text-sm text-stone-900 leading-relaxed">
                                            {orderData.shipping.address}<br />
                                            {orderData.shipping.city}, {orderData.shipping.state} {orderData.shipping.postalCode}<br />
                                            {orderData.shipping.country}
                                        </p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Sidebar (Payment & Actions) */}
                        <div className="lg:w-1/3 mt-12 lg:mt-0 space-y-8 lg:sticky lg:top-24">

                            {/* Payment Summary */}
                            <div className="bg-white rounded-3xl border border-stone-200 p-8">
                                <h3 className="text-sm font-bold tracking-widest uppercase text-stone-900 mb-6">Payment Summary</h3>

                                <div className="mb-8 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-stone-50 flex items-center justify-center rounded-full text-stone-900">
                                        <FiCreditCard size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-0.5">Method</p>
                                        <p className="text-sm font-bold text-stone-900">{getPaymentMethodName(orderData.payment.method)}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between text-stone-500">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(orderData.totals.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-stone-500">
                                        <span>Shipping</span>
                                        <span>{orderData.totals.shipping === 0 ? 'Complimentary' : formatCurrency(orderData.totals.shipping)}</span>
                                    </div>
                                    <div className="flex justify-between text-stone-500">
                                        <span>Estimated Tax</span>
                                        <span>{formatCurrency(orderData.totals.tax)}</span>
                                    </div>
                                    <div className="flex justify-between pt-6 border-t border-stone-100 mt-6">
                                        <span className="font-bold text-stone-900">Total</span>
                                        <span className="font-bold text-stone-900">{formatCurrency(orderData.totals.total)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Order Actions */}
                            <div className="space-y-3">
                                <button onClick={handleTrackOrder} className="w-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold tracking-widest uppercase py-4 rounded-full flex items-center justify-center gap-2 transition-colors shadow-lg shadow-stone-900/10">
                                    <FiTruck size={14} /> Track Package
                                </button>
                                <button onClick={handleDownloadInvoice} className="w-full bg-white border border-stone-200 text-stone-900 hover:bg-stone-50 text-xs font-bold tracking-widest uppercase py-4 rounded-full flex items-center justify-center gap-2 transition-colors">
                                    <FiFileText size={14} /> Download Invoice
                                </button>
                            </div>

                            {/* Need Help Section */}
                            <div className="bg-stone-50 rounded-3xl p-8 border border-stone-100 text-center">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-stone-900 shadow-sm">
                                    <FiHeadphones size={18} />
                                </div>
                                <h3 className="text-sm font-bold tracking-widest uppercase text-stone-900 mb-2">Concierge Support</h3>
                                <p className="text-xs text-stone-500 mb-6 leading-relaxed">
                                    Have inquiries regarding your order? Our dedicated team is available 24/7.
                                </p>
                                <button onClick={handleContactSupport} className="text-xs font-bold tracking-widest uppercase text-stone-900 border-b border-stone-900 pb-0.5 hover:text-stone-500 hover:border-stone-500 transition-colors">
                                    Contact Us
                                </button>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}