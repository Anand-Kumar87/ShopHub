'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase'; // 🔥 Real Database Connection Added
import {
    FiLock, FiCheck, FiShoppingBag, FiArrowLeft,
    FiCreditCard, FiX, FiGift, FiSmartphone,
    FiBriefcase, FiLoader
} from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useGlobalCurrency } from '../context/CurrencyContext';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // 🔥 FIX: Added auth checking state to prevent blinking/flashing
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // Global Cart Context
    const { cartItems, clearCart, getTotalPrice } = useCart();

    // Global Currency & Settings Context
    const {
        currency, convertPrice, exchangeRate,
        taxRate: contextTaxRate, freeShippingThreshold,
        shippingIndia, shippingTier1, shippingRow
    } = useGlobalCurrency() || {
        currency: 'USD', convertPrice: (v) => `$${v}`, exchangeRate: 1,
        taxRate: 0.08, freeShippingThreshold: 100,
        shippingIndia: 15, shippingTier1: 50, shippingRow: 80
    };

    // Admin Settings (For Gateways & Real Logistics)
    const [adminSettings, setAdminSettings] = useState({
        enableStripe: true, enableRazorpay: true, enableManualBank: true, razorpayKeyId: ''
    });
    const [dbSettings, setDbSettings] = useState(null);

    // Form States
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', phone: '',
        address: '', city: '', postalCode: '', state: '', country: 'IN', // Default to India
        // Payment Specific Data
        cardNumber: '', expiryDate: '', cvv: '', cardName: '',
        upiId: '',
        bankName: '', accountNumber: '', ifscCode: ''
    });

    const [paymentMethod, setPaymentMethod] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [newsletter, setNewsletter] = useState(false);

    // --- COUPON STATES ---
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [showCelebration, setShowCelebration] = useState(false);

    // Modal & Processing States
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [finalOrder, setFinalOrder] = useState(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [paymentError, setPaymentError] = useState('');

    // Hydration, Auth Guard & Database Fetching
    useEffect(() => {
        setMounted(true);

        const checkAuthAndFetchSettings = async () => {
            let localUser = JSON.parse(localStorage.getItem('currentUser'));
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                if (!localUser || localUser.email !== session.user.email) {
                    const userObj = {
                        id: session.user.id,
                        email: session.user.email,
                        firstName: session.user.user_metadata?.first_name || 'Client',
                        lastName: session.user.user_metadata?.last_name || '',
                    };
                    localStorage.setItem('currentUser', JSON.stringify(userObj));
                    localUser = userObj;
                    window.dispatchEvent(new Event('userStateChange'));
                }
            }

            if (!session && (!localUser || !localUser.email)) {
                toast.error('Please verify your email to securely place your order.', {
                    id: 'auth-guard',
                    icon: '🔒',
                    style: { background: '#1c1917', color: '#fff' }
                });
                router.replace('/checkout-login?redirect=/checkout');
                return;
            }

            setFormData(prev => ({
                ...prev,
                email: localUser.email,
                firstName: localUser.firstName || '',
                lastName: localUser.lastName || ''
            }));

            setIsCheckingAuth(false);

            try {
                const { data: dbData, error } = await supabase.from('admin_settings').select('*').single();

                if (dbData && !error) {
                    setAdminSettings(dbData);
                    setDbSettings(dbData);
                    if (dbData.enableStripe) setPaymentMethod('stripe');
                    else if (dbData.enableRazorpay) setPaymentMethod('razorpay');
                } else {
                    const localSettings = JSON.parse(localStorage.getItem('shophub_admin_settings'));
                    if (localSettings) {
                        setAdminSettings(localSettings);
                        setDbSettings(localSettings);
                        if (localSettings.enableStripe) setPaymentMethod('stripe');
                        else if (localSettings.enableRazorpay) setPaymentMethod('razorpay');
                    }
                }
            } catch (err) {
                console.error("Could not fetch settings");
            }
        };

        checkAuthAndFetchSettings();
    }, [router]);

    useEffect(() => {
        if (formData.country === 'IN' && adminSettings.enableRazorpay) {
            setPaymentMethod('razorpay');
        } else if (adminSettings.enableStripe) {
            setPaymentMethod('stripe');
        }
    }, [formData.country, adminSettings]);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // 🔥 FIX: ADVANCED COUPON LOGIC (Expiry, Single-Use, Student Verification)
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        const codeToApply = couponCode.trim().toUpperCase();

        // 1. Student Code Restriction Logic
        if (codeToApply === 'STUDENT10') {
            const emailLower = formData.email.toLowerCase();
            const isStudent = emailLower.endsWith('.edu') || emailLower.endsWith('.ac.in') || emailLower.endsWith('.edu.in');
            if (!isStudent) {
                toast.error('STUDENT10 code is exclusively for verified student emails (.edu or .ac.in).', { icon: '🎓' });
                return;
            }
        }

        try {
            // 2. Fetch from Database
            const { data: dbCoupons, error } = await supabase.from('coupons').select('*').eq('code', codeToApply);
            let validCoupon = dbCoupons?.[0];

            // Fallback to local admin coupons if DB fails
            if (!validCoupon) {
                const adminCoupons = JSON.parse(localStorage.getItem('shophub_admin_coupons')) || [
                    { code: 'FESTIVAL20', discount: 20, type: 'percent' },
                    { code: 'FLAT50', discount: 50, type: 'fixed' },
                    { code: 'WELCOME10', discount: 10, type: 'percent' },
                    { code: 'STUDENT10', discount: 10, type: 'percent' } // Added STUDENT10 to fallback
                ];
                validCoupon = adminCoupons.find(c => c.code.toUpperCase() === codeToApply);
            }

            if (!validCoupon) {
                toast.error('Invalid promo code.');
                return;
            }

            // 3. Check Expiry Date
            if (validCoupon.expires_at) {
                const expiryDate = new Date(validCoupon.expires_at);
                if (expiryDate < new Date()) {
                    toast.error('This promo code has expired.');
                    return;
                }
            }

            // 4. Single-Use Check (Verify if user has used this coupon in past orders)
            const { data: pastOrders } = await supabase.from('orders').select('id').eq('email', formData.email).eq('coupon', codeToApply);
            if (pastOrders && pastOrders.length > 0) {
                toast.error('You have already used this promo code. It can only be used once per user.');
                return;
            }

            // If all checks pass
            setAppliedCoupon(validCoupon);
            toast.success(`Awesome! You unlocked ${validCoupon.type === 'percent' ? `${validCoupon.discount}%` : convertPrice(validCoupon.discount)} off.`);
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 4000);
            setCouponCode('');

        } catch (err) {
            toast.error('Error verifying coupon. Please try again.');
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
    };

    // --- SMART DYNAMIC CALCULATIONS ---
    const rawSubtotal = getTotalPrice ? getTotalPrice() : 0;
    const rawTaxFromDB = dbSettings?.taxRate ?? contextTaxRate ?? 8;
    const actualTaxRate = rawTaxFromDB > 1 ? rawTaxFromDB / 100 : rawTaxFromDB;
    const TAX_RATE = actualTaxRate;

    const effectiveFreeShipping = (dbSettings?.freeShippingAmount ?? freeShippingThreshold) * exchangeRate;
    const effectiveShippingIN = (dbSettings?.shippingIndia ?? shippingIndia) * exchangeRate;
    const effectiveShippingTier1 = (dbSettings?.shippingTier1 ?? shippingTier1) * exchangeRate;
    const effectiveShippingRow = (dbSettings?.shippingRow ?? shippingRow) * exchangeRate;

    let SHIPPING_COST = 0;
    const tier1Countries = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL'];

    if (formData.country === 'IN') {
        if (rawSubtotal >= effectiveFreeShipping) {
            SHIPPING_COST = 0;
        } else {
            SHIPPING_COST = effectiveShippingIN;
        }
    } else if (tier1Countries.includes(formData.country)) {
        SHIPPING_COST = effectiveShippingTier1;
    } else if (formData.country) {
        SHIPPING_COST = effectiveShippingRow;
    } else {
        SHIPPING_COST = effectiveShippingIN;
    }


    let discountAmount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.type === 'percent') {
            discountAmount = rawSubtotal * (appliedCoupon.discount / 100);
        } else {
            discountAmount = appliedCoupon.discount * exchangeRate;
        }
    }
    discountAmount = Math.min(discountAmount, rawSubtotal);

    const subtotalAfterDiscount = rawSubtotal - discountAmount;
    const taxAmount = subtotalAfterDiscount * TAX_RATE;
    const orderTotal = cartItems?.length > 0 ? subtotalAfterDiscount + taxAmount + SHIPPING_COST : 0;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- ORDER SUBMISSION ---
    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        setPaymentError('');

        if (!cartItems || cartItems.length === 0) {
            toast.error('Your bag is empty. Please add items before proceeding.');
            return;
        }
        if (!termsAccepted) {
            toast.error('Please agree to the Terms and Conditions to proceed.');
            return;
        }

        setIsProcessingPayment(true);

        const existingOrders = JSON.parse(localStorage.getItem('shophub_orders')) || [];
        let nextIdNum = 1;
        if (existingOrders.length > 0) {
            const maxId = existingOrders.reduce((max, order) => {
                const match = String(order.orderNumber || order.id || '').match(/\d+$/);
                const num = match ? parseInt(match[0], 10) : 0;
                return num > max ? num : max;
            }, 0);
            nextIdNum = maxId + 1;
        }
        const generatedOrderNumber = `ORD-${String(nextIdNum).padStart(5, '0')}`;

        const paymentDetails = {
            method: paymentMethod,
            ...(paymentMethod === 'upi' && { upiId: formData.upiId }),
            ...(paymentMethod === 'bank' && {
                bankName: formData.bankName,
                accountNumber: formData.accountNumber,
                ifsc: formData.ifscCode
            })
        };

        const orderPayload = {
            id: generatedOrderNumber,
            orderNumber: generatedOrderNumber,
            date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            status: 'Processing',
            customerName: `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email,
            items: cartItems,
            
            // 🔥 FIX: ADDED ROOT LEVEL ADDRESS FIELDS FOR ACCOUNT PAGE COMPATIBILITY
            shippingAddress: formData.address,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
            country: formData.country,

            shipping_address: {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                street: formData.address, // 🔥 FIX: Account page looks for 'street'
                city: formData.city,
                state: formData.state,
                postalCode: formData.postalCode,
                zipCode: formData.postalCode, // 🔥 FIX: Account page looks for 'zipCode'
                country: formData.country,
            },
            shipping_cost: SHIPPING_COST, 
            payment_method: paymentMethod,
            payment_details: paymentDetails,
            coupon: appliedCoupon ? appliedCoupon.code : null,
            totals: {
                subtotal: rawSubtotal,
                discount: discountAmount,
                tax: taxAmount,
                shipping: SHIPPING_COST,
                total: orderTotal
            },
            total: orderTotal,
            total_amount: orderTotal,
            currency: currency
        };

        const localFinalTotal = orderTotal * exchangeRate;

        if (localFinalTotal < 1) {
            orderPayload.paymentStatus = 'Paid';
            await executeOrderSave(orderPayload, existingOrders);
            return;
        }

        try {
            if (paymentMethod === 'stripe') {
                const res = await fetch('/api/checkout/stripe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...orderPayload, total_amount: localFinalTotal })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Stripe API error");
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    throw new Error("Stripe API Route not found. Please setup backend.");
                }
            } else if (paymentMethod === 'razorpay') {
                const res = await loadRazorpayScript();
                if (!res) throw new Error("Razorpay SDK failed to load.");

                const apiRes = await fetch('/api/checkout/razorpay', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...orderPayload, total_amount: localFinalTotal })
                });

                const data = await apiRes.json();
                if (!apiRes.ok) throw new Error(data.error || "Backend API Error: Check Razorpay settings.");
                if (!data.orderId) throw new Error("Invalid response from Razorpay backend.");

                const options = {
                    key: adminSettings.razorpayKeyId,
                    amount: data.amount,
                    currency: data.currency,
                    name: adminSettings.storeName || "ShopHub E-Commerce",
                    description: "Premium Order Payment",
                    order_id: data.orderId,
                    handler: async function (response) {
                        orderPayload.paymentStatus = 'Paid';
                        orderPayload.razorpay_payment_id = response.razorpay_payment_id;
                        await executeOrderSave(orderPayload, existingOrders);
                    },
                    prefill: { name: orderPayload.customerName, email: orderPayload.email, contact: formData.phone },
                    theme: { color: "#1c1917" }
                };

                const paymentObject = new window.Razorpay(options);
                paymentObject.on('payment.failed', function (response) {
                    toast.error(response.error.description);
                    setIsProcessingPayment(false);
                });
                paymentObject.open();
            } else if (paymentMethod === 'cod') {
                orderPayload.paymentStatus = 'Unpaid';
                setTimeout(async () => await executeOrderSave(orderPayload, existingOrders), 1000);
            } else {
                orderPayload.paymentStatus = 'Unpaid';
                setTimeout(async () => await executeOrderSave(orderPayload, existingOrders), 1500);
            }

        } catch (error) {
            console.error("Payment Gateway Error:", error);
            setPaymentError(error.message);
            toast.error(error.message);
            setIsProcessingPayment(false);

            if (error.message.includes('API Route not found') || error.message.includes('Unexpected token')) {
                toast.error("Falling back to manual order.");
                orderPayload.paymentStatus = 'Unpaid';
                setTimeout(async () => await executeOrderSave(orderPayload, existingOrders), 1000);
            }
        }
    };

    // 🔥 MAIN DATABASE SAVE FUNCTION WITH EMAIL
    const executeOrderSave = async (orderPayload) => {
        setFinalOrder(orderPayload);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            const dbPayload = {
                orderNumber: orderPayload.orderNumber,
                customerName: orderPayload.customerName,
                email: orderPayload.email,
                items: orderPayload.items,
                shipping_address: orderPayload.shipping_address, 
                shipping: orderPayload.shipping_cost, 
                
                // 🔥 FIX: Passed Root level fields to Real Database
                shippingAddress: orderPayload.shippingAddress,
                city: orderPayload.city,
                state: orderPayload.state,
                postalCode: orderPayload.postalCode,
                country: orderPayload.country,
                
                payment_method: orderPayload.payment_method,
                payment_details: orderPayload.payment_details,
                paymentStatus: orderPayload.paymentStatus || 'Unpaid',
                coupon: orderPayload.coupon,
                totals: orderPayload.totals,
                total_amount: orderPayload.total_amount,
                currency: orderPayload.currency,
                status: orderPayload.status || 'Processing',
                user_id: session?.user?.id || null
            };

            const { error } = await supabase.from('orders').insert([dbPayload]);

            if (error) {
                console.error("Supabase Save Error Details:", error.message || error);
                toast.error("Cloud Save Failed. Check DB Columns.");
            } else {
                toast.success("Order placed successfully! 🎉", { icon: '✨' });
                setShowCelebration(true);
                setTimeout(() => setShowCelebration(false), 5000);

                for (const item of orderPayload.items) {
                    const { data: productData } = await supabase.from('products').select('stock').eq('id', item.id).single();
                    if (productData) {
                        const newStock = Math.max(0, productData.stock - item.quantity);
                        await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
                    }
                }

                try {
                    await fetch('/api/email/order-confirmation', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...dbPayload,
                            formatted_total: convertPrice(orderPayload.total_amount)
                        })
                    });
                } catch (emailErr) {
                    console.error("Failed to send email", emailErr);
                }
            }
        } catch (dbError) {
            console.error("Database connection error", dbError);
        }

        const existingOrdersList = JSON.parse(localStorage.getItem('shophub_orders')) || [];
        localStorage.setItem('shophub_orders', JSON.stringify([orderPayload, ...existingOrdersList]));

        setIsProcessingPayment(false);
        if (clearCart) clearCart();
        setIsSuccessModalOpen(true);
    };

    const renderOrderSummary = () => (
        <div className="bg-stone-50 rounded-3xl p-8 border border-stone-100">
            <div className="flex items-center mb-8 border-b border-stone-200 pb-4 gap-3">
                <FiShoppingBag className="text-stone-900" size={20} />
                <h2 className="text-lg font-light text-stone-900">
                    Your <span className="font-serif italic font-bold">Bag</span>
                </h2>
            </div>

            <div className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto pr-2 hide-scrollbar">
                {!cartItems || cartItems.length === 0 ? (
                    <p className="text-stone-500 text-center py-8 text-sm">Your bag is empty</p>
                ) : (
                    cartItems.map((item, idx) => {
                        const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
                        return (
                            <div key={idx} className="flex gap-4 group">
                                <div className="w-16 sm:w-20 aspect-[3/4] bg-white rounded-lg overflow-hidden flex-shrink-0 border border-stone-100">
                                    {item.image || item.images?.[0] ? (
                                        <img
                                            src={item.image || item.images[0]}
                                            alt={item.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-stone-200" />
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <h4 className="text-sm font-bold text-stone-900 line-clamp-1 mb-1">{item.name}</h4>
                                    <p className="text-xs text-stone-500 uppercase tracking-widest mb-1">Qty: {item.quantity}</p>
                                    <p className="text-sm font-bold text-stone-900">{convertPrice(itemPrice * item.quantity)}</p>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            <div className="border-t border-stone-200 pt-6 mb-6">
                {!appliedCoupon ? (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Promo code"
                            value={couponCode}
                            onChange={e => setCouponCode(e.target.value)}
                            className="flex-1 px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm uppercase tracking-widest"
                        />
                        <button
                            type="button"
                            onClick={handleApplyCoupon}
                            className="bg-stone-900 text-white px-6 py-3 rounded-lg text-xs font-bold tracking-widest uppercase hover:bg-stone-800 transition-colors"
                        >
                            Apply
                        </button>
                    </div>
                ) : (
                    <div className="flex justify-between items-center bg-green-50 text-green-700 px-4 py-3 rounded-lg border border-green-100 animate-fade-in">
                        <div className="flex items-center gap-2">
                            <FiGift size={16} />
                            <span className="text-xs font-bold tracking-widest uppercase">{appliedCoupon.code} Applied</span>
                        </div>
                        <button onClick={removeCoupon} type="button" className="text-green-700 hover:text-green-900 transition-colors">
                            <FiX size={16} />
                        </button>
                    </div>
                )}
            </div>

            <div className="border-t border-stone-200 pt-6 space-y-4 text-sm">
                <div className="flex justify-between text-stone-500">
                    <span>Subtotal</span>
                    <span className="font-medium text-stone-900">{convertPrice(rawSubtotal)}</span>
                </div>
                {appliedCoupon && (
                    <div className="flex justify-between text-green-600 animate-fade-in">
                        <span>Discount ({appliedCoupon.code})</span>
                        <span className="font-bold">-{convertPrice(discountAmount)}</span>
                    </div>
                )}
                <div className="flex justify-between text-stone-500">
                    <span>Shipping {formData.country === 'IN' && rawSubtotal >= effectiveFreeShipping ? '(Free)' : ''}</span>
                    <span className="font-medium text-stone-900">{SHIPPING_COST === 0 ? 'Free' : convertPrice(SHIPPING_COST)}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                    <span>Estimated Tax ({(TAX_RATE * 100).toFixed(1)}%)</span>
                    <span className="font-medium text-stone-900">{convertPrice(taxAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-stone-200 pt-4 mt-4 text-base">
                    <span className="font-bold text-stone-900">Total</span>
                    <span className="font-bold text-stone-900">{convertPrice(orderTotal)}</span>
                </div>
            </div>
        </div>
    );

    if (!mounted || isCheckingAuth) {
        return (
            <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center animate-fade-in">
                <FiLoader className="text-3xl text-stone-300 animate-spin mb-4" />
                <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400">Verifying Security...</p>
            </div>
        );
    }

    return (
        <main className="animate-fade-in bg-white min-h-screen pb-24 relative overflow-hidden">

            <style jsx>{`
                @keyframes fall {
                    0% { transform: translateY(-10vh) rotate(0deg) scale(0); opacity: 1; }
                    10% { transform: translateY(0vh) rotate(45deg) scale(1); }
                    100% { transform: translateY(110vh) rotate(720deg) scale(1); opacity: 0; }
                }
                .confetti { 
                    position: absolute; 
                    width: 8px; height: 16px; 
                    top: -10px; border-radius: 4px; 
                    animation: fall 3.5s cubic-bezier(.37,0,.63,1) forwards; 
                }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .spinner { animation: spin 1s linear infinite; }
            `}</style>

            {/* CONFETTI OVERLAY */}
            {showCelebration && (
                <div className="fixed inset-0 pointer-events-none z-[100] flex justify-center items-start overflow-hidden">
                    {Array.from({ length: 100 }).map((_, i) => {
                        const colors = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899'];
                        const bg = colors[Math.floor(Math.random() * colors.length)];
                        return (
                            <div
                                key={i}
                                className="confetti"
                                style={{
                                    left: `${Math.random() * 100}vw`,
                                    backgroundColor: bg,
                                    animationDelay: `${Math.random() * 0.5}s`,
                                    transform: `rotate(${Math.random() * 360}deg)`
                                }}
                            />
                        );
                    })}
                </div>
            )}

            {/* FULL SCREEN GATEWAY LOADER */}
            {isProcessingPayment && (
                <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-[150] flex flex-col items-center justify-center animate-fade-in">
                    <FiLoader className="text-white text-5xl spinner mb-6" />
                    <h2 className="text-2xl font-light text-white mb-2">
                        Connecting to {paymentMethod === 'stripe' ? 'Stripe' : 'Razorpay'} Securely
                    </h2>
                    <p className="text-stone-300 text-sm">Please do not close or refresh this window...</p>
                    <div className="mt-8 flex gap-2">
                        <FiLock className="text-stone-400" />
                        <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">256-bit Bank Grade Encryption</span>
                    </div>
                </div>
            )}

            <div className="bg-stone-50 pt-24 pb-12 border-b border-stone-200 px-4">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl md:text-5xl font-light text-stone-900 tracking-tight">
                            Secure <span className="font-serif italic font-bold">Checkout</span>
                        </h1>
                    </div>
                    <Link href="/cart" className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-stone-500 hover:text-stone-900 transition-colors border-b border-transparent hover:border-stone-900 pb-0.5">
                        <FiArrowLeft size={14} /> Back to Bag
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
                <form onSubmit={handlePlaceOrder} className="lg:flex lg:gap-12 items-start">

                    <div className="lg:w-2/3 space-y-16">
                        <div className="lg:hidden mb-12">
                            {renderOrderSummary()}
                        </div>

                        {/* Step 1: Shipping Information */}
                        <section>
                            <div className="flex items-baseline gap-4 mb-8">
                                <span className="text-sm font-bold text-stone-300 tracking-widest">01</span>
                                <h2 className="text-2xl font-light text-stone-900 border-b border-stone-200 pb-4 w-full">Shipping Destination</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">First Name *</label>
                                    <input required type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Last Name *</label>
                                    <input required type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Email Address *</label>
                                    <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Phone Number *</label>
                                    <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Address *</label>
                                    <input required type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">City *</label>
                                    <input required type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Postal Code *</label>
                                    <input required type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">State/Province *</label>
                                    <input required type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Country *</label>
                                    <select required name="country" value={formData.country} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm appearance-none font-bold">
                                        <option value="">Select a country</option>
                                        <option value="IN">India</option>
                                        <option disabled>──────────</option>
                                        <option value="US">United States</option>
                                        <option value="GB">United Kingdom</option>
                                        <option value="CA">Canada</option>
                                        <option value="AU">Australia</option>
                                        <option disabled>──────────</option>
                                        <option value="FR">France</option>
                                        <option value="DE">Germany</option>
                                        <option value="IT">Italy</option>
                                        <option value="ES">Spain</option>
                                        <option value="NL">Netherlands</option>
                                        <option value="SE">Sweden</option>
                                        <option value="CH">Switzerland</option>
                                        <option disabled>──────────</option>
                                        <option value="AE">United Arab Emirates</option>
                                        <option value="SG">Singapore</option>
                                        <option value="JP">Japan</option>
                                        <option value="NZ">New Zealand</option>
                                        <option value="ZA">South Africa</option>
                                        <option value="MX">Mexico</option>
                                        <option value="BR">Brazil</option>
                                        <option value="ROW">Rest of the World</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Step 2: Payment Gateways */}
                        <section>
                            <div className="flex items-baseline gap-4 mb-8">
                                <span className="text-sm font-bold text-stone-300 tracking-widest">02</span>
                                <h2 className="text-2xl font-light text-stone-900 border-b border-stone-200 pb-4 w-full">Payment Method</h2>
                            </div>
                            <div className="space-y-4">
                                {paymentError && (
                                    <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm mb-4 animate-fade-in">
                                        Error: {paymentError}
                                    </div>
                                )}

                                {/* Stripe */}
                                {adminSettings.enableStripe && (
                                    <div className={`border rounded-xl p-5 transition-all duration-300 ${paymentMethod === 'stripe' ? 'border-stone-900 bg-stone-50/50' : 'border-stone-200 hover:border-stone-300'}`}>
                                        <label className="flex items-center justify-between cursor-pointer w-full">
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value="stripe"
                                                    checked={paymentMethod === 'stripe'}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                    className="w-4 h-4 text-stone-900 border-stone-300 focus:ring-stone-900 accent-stone-900 cursor-pointer"
                                                />
                                                <span className="ml-3 font-bold text-stone-900 text-sm flex items-center gap-2">Credit / Debit Card (Stripe)</span>
                                            </div>
                                            <div className="flex gap-1 text-stone-400">
                                                <FiCreditCard size={18} />
                                            </div>
                                        </label>
                                        {paymentMethod === 'stripe' && (
                                            <p className="text-xs text-stone-500 mt-3 ml-7 animate-fade-in">
                                                You will be securely redirected to Stripe to complete your purchase using a Credit or Debit Card.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Razorpay */}
                                {adminSettings.enableRazorpay && (
                                    <div className={`border rounded-xl p-5 transition-all duration-300 ${paymentMethod === 'razorpay' ? 'border-stone-900 bg-stone-50/50' : 'border-stone-200 hover:border-stone-300'}`}>
                                        <label className="flex items-center justify-between cursor-pointer w-full">
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value="razorpay"
                                                    checked={paymentMethod === 'razorpay'}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                    className="w-4 h-4 text-stone-900 border-stone-300 focus:ring-stone-900 accent-stone-900 cursor-pointer"
                                                />
                                                <span className="ml-3 font-bold text-stone-900 text-sm flex items-center gap-2">UPI & Cards (Razorpay)</span>
                                            </div>
                                            <div className="flex gap-1 text-stone-400">
                                                <FiSmartphone size={18} />
                                            </div>
                                        </label>
                                        {paymentMethod === 'razorpay' && (
                                            <p className="text-xs text-stone-500 mt-3 ml-7 animate-fade-in">
                                                Secure payment via Razorpay. Supports UPI, Cards, NetBanking, and Wallets. Best for Indian customers.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Manual UPI Entry */}
                                {adminSettings.enableManualBank && (
                                    <div className={`border rounded-xl p-5 transition-all duration-300 ${paymentMethod === 'upi' ? 'border-stone-900 bg-stone-50/50' : 'border-stone-200 hover:border-stone-300'}`}>
                                        <label className="flex items-center justify-between cursor-pointer w-full">
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value="upi"
                                                    checked={paymentMethod === 'upi'}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                    className="w-4 h-4 text-stone-900 border-stone-300 focus:ring-stone-900 accent-stone-900 cursor-pointer"
                                                />
                                                <span className="ml-3 font-bold text-stone-900 text-sm flex items-center gap-2">UPI (Manual)</span>
                                            </div>
                                            <div className="flex gap-1 text-stone-400">
                                                <FiSmartphone size={18} />
                                            </div>
                                        </label>
                                        {paymentMethod === 'upi' && (
                                            <div className="mt-4 ml-7 animate-fade-in space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Your UPI ID *</label>
                                                    <input
                                                        required
                                                        type="text"
                                                        name="upiId"
                                                        value={formData.upiId}
                                                        onChange={handleInputChange}
                                                        placeholder="username@upi"
                                                        className="w-full px-5 py-3.5 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm lowercase"
                                                    />
                                                </div>
                                                <p className="text-xs text-stone-500 bg-stone-100 p-3 rounded-lg">
                                                    Send payment to <strong>shophub@bank</strong>. Your order will remain "Unpaid" until we verify the transaction manually.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Cash on Delivery (COD) */}
                                {adminSettings.enableCOD && (
                                    <div className={`border rounded-xl p-5 transition-all duration-300 ${paymentMethod === 'cod' ? 'border-stone-900 bg-stone-50/50' : 'border-stone-200 hover:border-stone-300'}`}>
                                        <label className="flex items-center justify-between cursor-pointer w-full">
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value="cod"
                                                    checked={paymentMethod === 'cod'}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                    className="w-4 h-4 text-stone-900 border-stone-300 focus:ring-stone-900 accent-stone-900 cursor-pointer"
                                                />
                                                <span className="ml-3 font-bold text-stone-900 text-sm flex items-center gap-2">Cash on Delivery (COD)</span>
                                            </div>
                                            <div className="flex gap-1 text-stone-400">
                                                <FiBriefcase size={18} />
                                            </div>
                                        </label>
                                        {paymentMethod === 'cod' && (
                                            <p className="text-xs text-stone-500 mt-3 ml-7 animate-fade-in">
                                                Pay in cash when your order arrives. Please keep exact change ready.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Manual Bank Transfer */}
                                {adminSettings.enableManualBank && (
                                    <div className={`border rounded-xl p-5 transition-all duration-300 ${paymentMethod === 'bank' ? 'border-stone-900 bg-stone-50/50' : 'border-stone-200 hover:border-stone-300'}`}>
                                        <label className="flex items-center justify-between cursor-pointer w-full">
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value="bank"
                                                    checked={paymentMethod === 'bank'}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                    className="w-4 h-4 text-stone-900 border-stone-300 focus:ring-stone-900 accent-stone-900 cursor-pointer"
                                                />
                                                <span className="ml-3 font-bold text-stone-900 text-sm flex items-center gap-2">Direct Bank Transfer</span>
                                            </div>
                                            <div className="flex gap-1 text-stone-400">
                                                <FiBriefcase size={18} />
                                            </div>
                                        </label>
                                        {paymentMethod === 'bank' && (
                                            <div className="mt-4 ml-7 animate-fade-in space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Your Bank Name</label>
                                                        <input required type="text" name="bankName" value={formData.bankName} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 text-sm" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Account Number</label>
                                                        <input required type="text" name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 text-sm" />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">IFSC / Routing Code</label>
                                                        <input required type="text" name="ifscCode" value={formData.ifscCode} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 text-sm uppercase" />
                                                    </div>
                                                </div>
                                                <div className="text-xs text-stone-500 bg-stone-100 p-3 rounded-lg border border-stone-200">
                                                    <p className="font-bold text-stone-900 mb-1">Transfer to:</p>
                                                    ShopHub Inc. | Acc: 00987654321 | Routing: CHASEXXX
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>

                        <section>
                            <div className="flex items-baseline gap-4 mb-8">
                                <span className="text-sm font-bold text-stone-300 tracking-widest">03</span>
                                <h2 className="text-2xl font-light text-stone-900 border-b border-stone-200 pb-4 w-full">Review & Confirm</h2>
                            </div>
                            <div className="space-y-5">
                                <div className="flex items-start group">
                                    <div className="relative flex items-center mt-0.5">
                                        <input
                                            type="checkbox"
                                            id="termsAccepted"
                                            checked={termsAccepted}
                                            onChange={(e) => setTermsAccepted(e.target.checked)}
                                            className="w-4 h-4 text-stone-900 focus:ring-stone-900 border-stone-300 rounded cursor-pointer accent-stone-900"
                                        />
                                    </div>
                                    <label htmlFor="termsAccepted" className="ml-3 text-sm text-stone-600 leading-relaxed cursor-pointer hover:text-stone-900 transition-colors">
                                        I accept the <Link href="/terms" className="text-stone-900 underline underline-offset-4">Terms and Conditions</Link> and <Link href="/privacy" className="text-stone-900 underline underline-offset-4">Privacy Policy</Link> *
                                    </label>
                                </div>
                                <div className="flex items-start group">
                                    <div className="relative flex items-center mt-0.5">
                                        <input
                                            type="checkbox"
                                            id="newsletter"
                                            checked={newsletter}
                                            onChange={(e) => setNewsletter(e.target.checked)}
                                            className="w-4 h-4 text-stone-900 focus:ring-stone-900 border-stone-300 rounded cursor-pointer accent-stone-900"
                                        />
                                    </div>
                                    <label htmlFor="newsletter" className="ml-3 text-sm text-stone-600 leading-relaxed cursor-pointer hover:text-stone-900 transition-colors">
                                        Sign up for exclusive offers and collection updates.
                                    </label>
                                </div>
                            </div>

                            <div className="mt-12">
                                <button
                                    type="submit"
                                    disabled={isProcessingPayment}
                                    className="w-full bg-stone-900 text-white font-bold tracking-widest uppercase text-xs py-5 rounded-full hover:bg-stone-800 transition-colors shadow-xl shadow-stone-900/10 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {paymentMethod === 'stripe' || paymentMethod === 'razorpay' ? 'Proceed to Secure Payment' : <><FiLock size={14} /> Place Order</>}
                                </button>
                                <p className="text-center text-stone-400 text-[10px] uppercase tracking-widest mt-4 flex items-center justify-center gap-1.5">
                                    <FiLock size={10} /> 256-bit Encrypted Checkout
                                </p>
                            </div>
                        </section>
                    </div>

                    <div className="hidden lg:block lg:w-1/3 sticky top-24">
                        {renderOrderSummary()}
                    </div>
                </form>
            </div>

            {/* Success Modal (Glassmorphism) */}
            {isSuccessModalOpen && (
                <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl p-10 max-w-md mx-auto text-center transform scale-100 transition-transform shadow-2xl relative border border-stone-100">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stone-900 mb-6 shadow-xl shadow-stone-900/20">
                            <FiCheck className="text-2xl text-white" />
                        </div>
                        <h2 className="text-3xl font-light text-stone-900 mb-2">Order Confirmed</h2>
                        <p className="text-stone-500 mb-8 text-sm leading-relaxed">
                            {['stripe', 'razorpay'].includes(paymentMethod)
                                ? "Payment successful. Your curation is currently being processed."
                                : "Order received. Please complete your manual payment to process the curation."}
                            <br /><br />A confirmation has been sent to your email.
                        </p>

                        <div className="bg-stone-50 border border-stone-100 p-6 rounded-2xl text-left mb-10">
                            <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-1">Order Number</p>
                            <p className="font-serif italic font-bold text-lg text-stone-900 mb-4">{finalOrder?.orderNumber}</p>
                            <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-1">Total Paid</p>
                            <p className="text-sm font-bold text-stone-900">{convertPrice(finalOrder?.total_amount || 0)}</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Link href={`/account?tab=orders`} className="w-full bg-stone-900 text-white text-xs font-bold tracking-widest uppercase px-8 py-4 rounded-full hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/10 text-center flex items-center justify-center">
                                View in Account
                            </Link>
                            <Link href="/" className="w-full bg-white text-stone-900 border border-stone-200 text-xs font-bold tracking-widest uppercase px-8 py-4 rounded-full hover:bg-stone-50 transition-colors text-center flex items-center justify-center">
                                Return Home
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
