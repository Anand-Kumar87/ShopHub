'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';
import { useGlobalCurrency } from '../context/CurrencyContext';
import CurrencySelector from '../components/CurrencySelector';
import toast from 'react-hot-toast';
import {
    FiGrid, FiBox, FiShoppingBag, FiUsers, FiTag,
    FiMail, FiSettings, FiPlus, FiEdit2, FiTrash2,
    FiX, FiGlobe, FiCircle, FiCheck, FiGift, FiUploadCloud, FiImage,
    FiCreditCard, FiSmartphone, FiBriefcase, FiTruck // 🔥 बस यहाँ FiTruck जोड़ना है
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
// Helper for generating IDs safely
const generateId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

// Safe parsing helpers for Order Modal
const safePrice = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
};

// 🔥 FIX: 12-Hour AM/PM Format
const safeDate = (dateString) => {
    if (!dateString) return 'Pending / Not Set';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? 'Pending / Not Set' : d.toLocaleString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    }).toUpperCase();
};

export default function AdminDashboard() {
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');

    const { currency, convertPrice, exchangeRate } = useGlobalCurrency() || { currency: 'USD', convertPrice: (val) => `$${val}`, exchangeRate: 1 };

    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [messages, setMessages] = useState([]);
    const [coupons, setCoupons] = useState([]);

    const [settings, setSettings] = useState({
        storeName: 'ShopHub', contactEmail: 'concierge@shophub.com', currency: 'USD', maintenanceMode: false,
        taxRate: 0.08, freeShippingAmount: 100, shippingIndia: 15, shippingTier1: 50, shippingRow: 80,
        enableStripe: true, stripePublicKey: '', stripeSecretKey: '',
        enableRazorpay: true, razorpayKeyId: '', razorpayKeySecret: '',
        enableManualBank: true,
        enableCOD: false, // 🔥 NEW: Cash on Delivery Setting
        enableShiprocket: false, shiprocketEmail: '', shiprocketPassword: '', shiprocketPickup: 'Primary'
    });

    const [settingsForm, setSettingsForm] = useState({});

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedCategoryProducts, setSelectedCategoryProducts] = useState([]);

    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);

    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState(null);

    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
    const [customerForm, setCustomerForm] = useState({ id: null, name: '', email: '', role: 'customer', orders: 0, spent: 0 });

    const [productForm, setProductForm] = useState({
        name: '', sku: '', category: '', price: 0, salePrice: 0, onSale: false,
        stock: 0, status: 'active', images: [], description: '', colors: '', sizes: ''
    });

    const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', description: '', image: '' });

    // 🔥 FIX: Added 'expires_at' and 'target_role' to the form state
    const [couponForm, setCouponForm] = useState({ code: '', discount: 0, type: 'percent', expires_at: '', target_role: 'all' });

    const productFileInputRef = useRef(null);
    const categoryFileInputRef = useRef(null);

    useEffect(() => {
        setMounted(true);
        let adminOrderSub = null;
        let adminMsgSub = null;

        const initDashboard = async () => {
            // Load Settings
            try {
                const dbRes = await fetch('/api/admin/settings');
                if (dbRes.ok) {
                    const dbData = await dbRes.json();
                    setSettings(prev => ({ ...prev, ...dbData }));
                } else {
                    const localSettings = JSON.parse(localStorage.getItem('shophub_admin_settings'));
                    if (localSettings) setSettings(prev => ({ ...prev, ...localSettings }));
                }
            } catch (error) {
                console.warn("Failed to fetch settings from API, using defaults.");
            }

            // Sync Orders from DB
            const { data: realOrders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
            if (realOrders && realOrders.length > 0) setOrders(realOrders);
            else setOrders(JSON.parse(localStorage.getItem('shophub_orders')) || []);

            // Sync Messages from DB
            const { data: realMessages, error: msgError } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false });
            if (!msgError && realMessages && realMessages.length > 0) {
                setMessages(realMessages);
            } else {
                setMessages([]);
            }

            // Sync Products from DB
            const { data: realProducts } = await supabase.from('products').select('*').order('created_at', { ascending: false });
            if (realProducts && realProducts.length > 0) {
                setProducts(realProducts.map(p => ({ ...p, images: p.images || (p.image ? [p.image] : []) })));
            } else {
                const loadedProducts = JSON.parse(localStorage.getItem('shophub_products')) || [];
                setProducts(loadedProducts.map(p => ({ ...p, images: p.images || (p.image ? [p.image] : []) })));
            }

            // Sync Categories from DB
            const { data: realCategories } = await supabase.from('categories').select('*');
            if (realCategories && realCategories.length > 0) setCategories(realCategories);
            else setCategories(JSON.parse(localStorage.getItem('shophub_categories')) || []);

            // Sync Coupons from DB
            const { data: realCoupons } = await supabase.from('coupons').select('*');
            if (realCoupons && realCoupons.length > 0) setCoupons(realCoupons);
            else setCoupons(JSON.parse(localStorage.getItem('shophub_admin_coupons')) || []);

            // Fetch Profiles & Customers Together from Supabase
            const { data: profilesData } = await supabase.from('profiles').select('*');
            const { data: customersData } = await supabase.from('customers').select('*');

            let combinedClients = [];

            if (profilesData && profilesData.length > 0) {
                const mappedProfiles = profilesData.map(p => {
                    const fullName = (p.first_name || p.last_name)
                        ? `${p.first_name || ''} ${p.last_name || ''}`.trim()
                        : (p.email ? p.email.split('@')[0] : 'Client');

                    return {
                        id: p.id,
                        name: fullName,
                        email: p.email,
                        role: p.role || 'customer',
                        joined: p.created_at || new Date().toISOString(),
                        orders: 0,
                        spent: 0,
                        isProfile: true
                    };
                });
                combinedClients = [...mappedProfiles];
            }

            if (customersData && customersData.length > 0) {
                const existingEmails = combinedClients.map(c => c.email);
                const uniqueCustomers = customersData.filter(c => !existingEmails.includes(c.email));
                combinedClients = [...combinedClients, ...uniqueCustomers];
            }

            if (combinedClients.length > 0) {
                setCustomers(combinedClients);
            } else {
                setCustomers(JSON.parse(localStorage.getItem('shophub_customers')) || []);
            }

            // Realtime subscriptions
            adminOrderSub = supabase.channel(`admin-orders-sync-${Date.now()}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
                    if (payload.eventType === 'INSERT') setOrders(prev => [payload.new, ...prev]);
                    else if (payload.eventType === 'UPDATE') setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
                    else if (payload.eventType === 'DELETE') setOrders(prev => prev.filter(o => o.id !== payload.old.id));
                }).subscribe();

            adminMsgSub = supabase.channel(`admin-inquiries-sync-${Date.now()}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, payload => {
                    if (payload.eventType === 'INSERT') setMessages(prev => [payload.new, ...prev]);
                    else if (payload.eventType === 'UPDATE') setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
                    else if (payload.eventType === 'DELETE') setMessages(prev => prev.filter(m => m.id !== payload.old.id));
                }).subscribe();
        };

        initDashboard();

        return () => {
            if (adminOrderSub) supabase.removeChannel(adminOrderSub);
            if (adminMsgSub) supabase.removeChannel(adminMsgSub);
        };
    }, []);

    // 🔥 AUTO-SCROLL & BACKGROUND SCROLL LOCK FOR MODALS
    useEffect(() => {
        const isAnyModalOpen = isProductModalOpen || isCategoryModalOpen || isMessageModalOpen || isCouponModalOpen || isOrderModalOpen || isCustomerModalOpen || isNewCustomerModalOpen;

        if (isAnyModalOpen) {
            // 1. स्मूथ ऑटो-स्क्रॉल
            window.scrollTo({ top: 0, behavior: 'smooth' });
            // 2. बैकग्राउंड स्क्रॉल लॉक
            document.body.style.overflow = 'hidden';
        } else {
            // मोडल बंद होने पर स्क्रॉल वापस चालू
            document.body.style.overflow = 'unset';
        }
    }, [isProductModalOpen, isCategoryModalOpen, isMessageModalOpen, isCouponModalOpen, isOrderModalOpen, isCustomerModalOpen, isNewCustomerModalOpen]);

    // 🔥 FIX: Removed Exchange Rate conversion here so it stays pure INR in admin panel
    useEffect(() => {
        setSettingsForm({
            ...settings,
            freeShippingAmount: Number((settings.freeShippingAmount || 0).toFixed(2)),
            shippingIndia: Number((settings.shippingIndia || 0).toFixed(2)),
            shippingTier1: Number((settings.shippingTier1 || 0).toFixed(2)),
            shippingRow: Number((settings.shippingRow || 0).toFixed(2)),
        });
    }, [settings]);

    if (!mounted) return null;

    // 🔥 FIX: Real-time dynamic calculation for Customers based on live Orders data
    const dynamicCustomers = customers.map(cust => {
        const custOrders = orders.filter(o => (o.email && o.email === cust.email) || (o.customerName && o.customerName === cust.name));
        const actualOrderCount = custOrders.length;
        const actualSpent = custOrders.reduce((sum, o) => sum + safePrice(o.total_amount || o.total), 0);
        return {
            ...cust,
            orders: actualOrderCount > 0 ? actualOrderCount : (cust.orders || 0),
            spent: actualSpent > 0 ? actualSpent : (cust.spent || 0)
        };
    });

    // 🔥 FIX: Live Stats Calculations for Overview
    const totalRevenue = orders.reduce((sum, order) => sum + safePrice(order.totals?.total || order.total_amount || order.total), 0);
    const totalTaxCollected = orders.reduce((sum, order) => sum + safePrice(order.totals?.tax || order.tax), 0);
    const totalShippingCollected = orders.reduce((sum, order) => sum + safePrice(order.totals?.shipping || order.shipping || order.shippingCost), 0);
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const unreadMessages = messages.filter(m => m.status === 'unread').length;

    const handleImageUpload = (e, isCategory = false) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (isCategory) setCategoryForm(prev => ({ ...prev, image: event.target.result }));
                else setProductForm(prev => ({ ...prev, images: [...prev.images, event.target.result] }));
            };
            reader.readAsDataURL(file);
        });
    };

    const handlePaste = (e, isCategory = false) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (isCategory) setCategoryForm(prev => ({ ...prev, image: event.target.result }));
                    else setProductForm(prev => ({ ...prev, images: [...prev.images, event.target.result] }));
                };
                reader.readAsDataURL(blob);
            }
        }
    };

    const removeProductImage = (indexToRemove) => {
        setProductForm(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== indexToRemove) }));
    };

    const openProductModal = (product = null) => {
        if (product) {
            setSelectedProduct(product);
            setProductForm({
                ...product,
                // 🔥 FIX: Removed Exchange Rate conversion here so it stays pure INR in admin panel
                price: Number((product.price || 0).toFixed(2)),
                salePrice: Number(((product.salePrice || 0)).toFixed(2)),
                images: product.images || (product.image ? [product.image] : []),
                colors: product.colors ? product.colors.join(', ') : '',
                sizes: product.sizes ? product.sizes.join(', ') : ''
            });
        } else {
            setSelectedProduct(null);
            setProductForm({
                name: '', sku: '', category: '', price: 0, salePrice: 0, onSale: false,
                stock: 0, status: 'active', images: [], description: '', colors: '', sizes: ''
            });
        }
        setIsProductModalOpen(true);
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();

        // 1. Arrays को सही फॉर्मेट में सेट करना
        const colorsArray = typeof productForm.colors === 'string'
            ? productForm.colors.split(',').map(c => c.trim()).filter(Boolean)
            : productForm.colors || [];

        const sizesArray = typeof productForm.sizes === 'string'
            ? productForm.sizes.split(',').map(s => s.trim()).filter(Boolean)
            : productForm.sizes || [];

        // 2. फाइनल डेटा तैयार करना
        const finalProduct = {
            ...productForm,
            // 🔥 FIX: Removed Exchange Rate conversion here so it stays pure INR in admin panel
            price: Number(productForm.price),
            salePrice: Number(productForm.salePrice),
            colors: colorsArray,
            sizes: sizesArray,
            oldPrice: productForm.onSale ? Number(productForm.price) : null,
            tags: productForm.onSale ? ['Sale'] : ['New']
        };

        let newProducts = [];

        if (selectedProduct) {
            // 🔥 EDIT MODE: Update in Database
            const { error } = await supabase.from('products').update(finalProduct).eq('id', selectedProduct.id);

            if (error) {
                console.error("DB Error:", error);
                return toast.error("Database Update Failed: " + error.message);
            }

            newProducts = products.map(p => p.id === selectedProduct.id ? { ...p, ...finalProduct } : p);
            toast.success("Product updated successfully!");

        } else {
            // 🔥 CREATE MODE: Insert into Database STRICTLY
            const insertData = { ...finalProduct };

            // Supabase को खुद ID बनाने दो
            delete insertData.id;
            delete insertData.created_at;

            const { data, error } = await supabase.from('products').insert([insertData]).select();

            // अगर डेटाबेस में सेव नहीं हुआ, तो फंक्शन यहीं रुक जाएगा (No Fake Local Products)
            if (error) {
                console.error("DB Error:", error);
                return toast.error("Database Insert Failed: " + error.message);
            }

            const newProdObj = data && data.length > 0 ? data[0] : insertData;
            newProducts = [newProdObj, ...products];
            toast.success("Product created in REAL Database!");
        }

        // State और लोकल स्टोरेज (Home Page के लिए) अपडेट करो सिर्फ तब जब DB में पास हो जाए
        setProducts(newProducts);
        localStorage.setItem('shophub_products', JSON.stringify(newProducts));
        setIsProductModalOpen(false);
    };

    const deleteProduct = async (id) => {
        if (window.confirm("Remove this piece from the catalog?")) {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) console.error("DB Error:", error);

            const newProducts = products.filter(p => p.id !== id);
            setProducts(newProducts);
            localStorage.setItem('shophub_products', JSON.stringify(newProducts));
            toast.success("Product removed!");
        }
    };

    const openCategoryModal = (category = null) => {
        if (category) {
            setSelectedCategory(category);
            setCategoryForm({ ...category, image: category.image || '' });
            setSelectedCategoryProducts(products.filter(p => p.category === category.slug).map(p => p.id));
        } else {
            setSelectedCategory(null);
            setCategoryForm({ name: '', slug: '', description: '', image: '' });
            setSelectedCategoryProducts([]);
        }
        setIsCategoryModalOpen(true);
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();

        let newCats = [];
        const finalSlug = categoryForm.slug.toLowerCase().replace(/\s+/g, '-');
        const finalCategoryForm = { ...categoryForm, slug: finalSlug };

        if (selectedCategory) {
            // 🔥 EDIT MODE
            const { error } = await supabase.from('categories').update(finalCategoryForm).eq('id', selectedCategory.id);

            if (error) {
                console.error("DB Error:", error);
                return toast.error("Database Update Failed: " + error.message);
            }

            newCats = categories.map(c => c.id === selectedCategory.id ? { ...c, ...finalCategoryForm } : c);
            toast.success("Collection updated in Database!");
        } else {
            // 🔥 CREATE MODE
            const insertData = { ...finalCategoryForm };

            // Supabase को खुद ID बनाने दो
            delete insertData.id;
            delete insertData.created_at;

            const { data, error } = await supabase.from('categories').insert([insertData]).select();

            // 🔥 STRICT CHECK: अगर DB में सेव नहीं हुआ, तो लोकल स्टोरेज में भी सेव मत करो
            if (error) {
                console.error("DB Error:", error);
                return toast.error("Database Insert Failed: " + error.message);
            }

            const newCatObj = data && data.length > 0 ? data[0] : insertData;
            newCats = [newCatObj, ...categories];
            toast.success("Collection created successfully in Database!");
        }

        // 3. Update products associated with this category
        const updatedProducts = [...products];
        for (const p of updatedProducts) {
            const isSelected = selectedCategoryProducts.includes(p.id);
            if (isSelected && p.category !== finalSlug) {
                p.category = finalSlug;
                await supabase.from('products').update({ category: finalSlug }).eq('id', p.id);
            } else if (!isSelected && p.category === finalSlug) {
                p.category = '';
                await supabase.from('products').update({ category: '' }).eq('id', p.id);
            }
        }

        setProducts(updatedProducts);
        localStorage.setItem('shophub_products', JSON.stringify(updatedProducts));

        setCategories(newCats);
        localStorage.setItem('shophub_categories', JSON.stringify(newCats));
        setIsCategoryModalOpen(false);
    };

    const deleteCategory = async (id) => {
        if (window.confirm("Delete this collection?")) {
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (error) console.error("DB Error:", error);

            const newCats = categories.filter(c => c.id !== id);
            setCategories(newCats);
            localStorage.setItem('shophub_categories', JSON.stringify(newCats));
            toast.success("Collection removed!");
        }
    };

    const openCouponModal = (coupon = null) => {
        if (coupon) {
            setSelectedCoupon(coupon);
            // 🔥 FIX: Check if date exists and format for the input field (YYYY-MM-DD)
            let formattedDate = '';
            if (coupon.expires_at) {
                formattedDate = new Date(coupon.expires_at).toISOString().split('T')[0];
            }

            setCouponForm({
                ...coupon,
                discount: coupon.discount,
                expires_at: formattedDate,
                target_role: coupon.target_role || 'all'
            });
        } else {
            setSelectedCoupon(null);
            setCouponForm({ code: '', discount: 0, type: 'percent', expires_at: '', target_role: 'all' });
        }
        setIsCouponModalOpen(true);
    };

    const handleCouponSubmit = async (e) => {
        e.preventDefault();
        const formattedCode = couponForm.code.toUpperCase().replace(/\s+/g, '');

        const finalCoupon = {
            ...couponForm,
            code: formattedCode,
            discount: couponForm.discount,
            // 🔥 FIX: Store the date or null if not provided
            expires_at: couponForm.expires_at ? new Date(couponForm.expires_at).toISOString() : null,
            target_role: couponForm.target_role
        };

        let newCoupons = [];
        if (selectedCoupon) {
            const { error } = await supabase.from('coupons').update(finalCoupon).eq('id', selectedCoupon.id);
            if (error) console.error("DB Error:", error);
            newCoupons = coupons.map(c => c.id === selectedCoupon.id ? { ...c, ...finalCoupon } : c);
            toast.success("Promo code updated!");
        } else {
            const insertData = { ...finalCoupon, id: generateId() };
            delete insertData.created_at;

            const { data, error } = await supabase.from('coupons').insert([insertData]).select();
            if (error) {
                console.error("DB Error:", error);
                toast.error("Database sync failed, saving locally.");
            }

            const newCoupObj = data && data.length > 0 ? data[0] : insertData;
            newCoupons = [newCoupObj, ...coupons];
            toast.success("Promo code created successfully!");
        }

        setCoupons(newCoupons);
        localStorage.setItem('shophub_admin_coupons', JSON.stringify(newCoupons));
        setIsCouponModalOpen(false);
    };

    // 🔥 FIX: Missing deleteCoupon function added here!
    const deleteCoupon = async (id) => {
        if (window.confirm("Delete this promo code?")) {
            try {
                const { error } = await supabase.from('coupons').delete().eq('id', id);
                if (error) throw error;

                const newCoupons = coupons.filter(c => c.id !== id);
                setCoupons(newCoupons);
                localStorage.setItem('shophub_admin_coupons', JSON.stringify(newCoupons));
                toast.success("Promo code deleted successfully!");
            } catch (error) {
                console.error("Delete Error:", error);
                toast.error("Failed to delete promo code.");
            }
        }
    };

    const openCustomerModalForEdit = (cust = null) => {
        if (cust) {
            setCustomerForm({
                id: cust.id,
                name: cust.name || '',
                email: cust.email || '',
                role: cust.role || 'customer',
                orders: cust.orders || 0,
                // 🔥 FIX: Removed Exchange Rate conversion here so it stays pure INR in admin panel
                spent: cust.spent ? Number((cust.spent).toFixed(2)) : 0,
                isProfile: cust.isProfile || false
            });
        } else {
            setCustomerForm({ id: null, name: '', email: '', role: 'customer', orders: 0, spent: 0, isProfile: false });
        }
        setIsNewCustomerModalOpen(true);
    };

    const handleNewCustomerSubmit = async (e) => {
        e.preventDefault();
        // 🔥 FIX: Removed Exchange Rate conversion here so it stays pure INR in admin panel
        const baseSpentAmount = Number(customerForm.spent);
        const nameParts = customerForm.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        let updatedCustomersList = [];

        if (customerForm.id) {
            if (customerForm.isProfile) {
                await supabase.from('profiles').update({
                    first_name: firstName,
                    last_name: lastName,
                    email: customerForm.email,
                    role: customerForm.role
                }).eq('id', customerForm.id);
            } else {
                await supabase.from('customers').update({
                    name: customerForm.name,
                    email: customerForm.email,
                    orders: customerForm.orders,
                    spent: baseSpentAmount
                }).eq('id', customerForm.id);
            }

            updatedCustomersList = customers.map(c => c.id === customerForm.id ? {
                ...c,
                name: customerForm.name,
                email: customerForm.email,
                role: customerForm.role,
                orders: customerForm.orders,
                spent: baseSpentAmount
            } : c);

            toast.success("Client profile updated!");
        } else {
            const newId = generateId();
            const insertCustomer = {
                id: newId,
                name: customerForm.name,
                email: customerForm.email,
                orders: customerForm.orders,
                spent: baseSpentAmount
            };

            const { data, error } = await supabase.from('customers').insert([insertCustomer]).select();
            if (error) console.error("DB Error:", error);

            const newCustObj = data && data.length > 0 ? data[0] : insertCustomer;
            updatedCustomersList = [newCustObj, ...customers];
            toast.success("Client added successfully!");
        }

        setCustomers(updatedCustomersList);
        localStorage.setItem('shophub_customers', JSON.stringify(updatedCustomersList));
        setIsNewCustomerModalOpen(false);
    };

    const deleteCustomer = async (e, cust) => {
        e.stopPropagation();
        if (window.confirm(`Delete client "${cust.name}"?`)) {
            if (cust.isProfile) {
                await supabase.from('profiles').delete().eq('id', cust.id);
            } else {
                await supabase.from('customers').delete().eq('id', cust.id);
            }

            const newCustList = customers.filter(c => c.id !== cust.id);
            setCustomers(newCustList);
            localStorage.setItem('shophub_customers', JSON.stringify(newCustList));
            toast.success("Client removed!");
        }
    };

    const openOrderModal = (order) => {
        setSelectedOrder(order);
        setIsOrderModalOpen(true);
    };

    // 🔥 FIX: Order update logic precisely matching specific Order ID or Order Number
    const updateOrderStatus = async (orderId, field, newValue) => {
        if (!orderId) return toast.error("Unable to update: Missing Order Reference");

        // Update local state strictly where ID matches
        setOrders(prevOrders => prevOrders.map(o =>
            (o.id === orderId || o.orderNumber === orderId) ? { ...o, [field]: newValue } : o
        ));

        if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.orderNumber === orderId)) {
            setSelectedOrder(prev => ({ ...prev, [field]: newValue }));
        }

        // Database Update Logic
        if (typeof orderId === 'string' && orderId.length > 20 && !orderId.startsWith('ORD-')) {
            // It's likely a Supabase UUID
            const { error } = await supabase.from('orders').update({ [field]: newValue }).eq('id', orderId);
            if (error) console.error('Failed to update DB', error);
            else toast.success("Status updated live!");
        } else {
            // LocalStorage Fallback (For test orders)
            const updated = orders.map(o => (o.id === orderId || o.orderNumber === orderId) ? { ...o, [field]: newValue } : o);
            localStorage.setItem('shophub_orders', JSON.stringify(updated));
            toast.success("Status updated locally!");
        }
    };

    const openCustomerModal = (customer) => { setSelectedCustomer(customer); setIsCustomerModalOpen(true); };

    const viewMessage = async (msg) => {
        setSelectedMessage(msg); setIsMessageModalOpen(true);
        if (msg.status === 'unread') {
            setMessages(messages.map(m => m.id === msg.id ? { ...m, status: 'read' } : m));
            await supabase.from('inquiries').update({ status: 'read' }).eq('id', msg.id);
        }
    };

    const handleSettingsSubmit = async (e) => {
        e.preventDefault();
        // 🔥 FIX: Removed Exchange Rate conversion here so it stays pure INR in admin panel
        const finalSettings = {
            ...settingsForm,
            freeShippingAmount: Number(settingsForm.freeShippingAmount),
            shippingIndia: Number(settingsForm.shippingIndia),
            shippingTier1: Number(settingsForm.shippingTier1),
            shippingRow: Number(settingsForm.shippingRow),
        };
        setSettings(finalSettings);
        try {
            await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalSettings)
            });
            localStorage.setItem('shophub_admin_settings', JSON.stringify(finalSettings));
            toast.success("Global settings & APIs updated successfully.");
        } catch (err) {
            localStorage.setItem('shophub_admin_settings', JSON.stringify(finalSettings));
            toast.success("Settings saved locally.");
        }
    };

    const TABS = [
        { id: 'dashboard', label: 'Overview', icon: FiGrid },
        { id: 'products', label: 'Catalog', icon: FiBox },
        { id: 'orders', label: 'Orders', icon: FiShoppingBag },
        { id: 'customers', label: 'Clientele', icon: FiUsers },
        { id: 'categories', label: 'Collections', icon: FiTag },
        { id: 'coupons', label: 'Promo Codes', icon: FiGift },
        { id: 'messages', label: 'Inquiries', icon: FiMail, badge: unreadMessages },
        { id: 'settings', label: 'Settings', icon: FiSettings },
    ];

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': case 'delivered': case 'paid': case 'admin': return 'bg-stone-900 text-white';
            case 'draft': case 'inactive': case 'cancelled': case 'unpaid': return 'bg-stone-200 text-stone-500';
            case 'unread': return 'bg-stone-900 text-white';
            case 'read': return 'bg-stone-100 text-stone-400';
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

    return (
        <div className="bg-white min-h-screen">
            <header className="bg-white border-b border-stone-200 px-6 py-5 flex justify-between items-center sticky top-0 z-30">
                <div className="flex items-center gap-6">
                    <Link href="/" className="text-xl font-light text-stone-900 tracking-tight">
                        ShopHub <span className="font-serif italic font-bold text-stone-400">Portal</span>
                    </Link>
                    <span className="hidden md:flex items-center gap-2 bg-green-50 text-green-700 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-green-100">
                        <FiCircle size={8} className="text-green-500 fill-current" /> Live Sync
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

            <main className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
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
                                            className={`w-full flex items-center justify-between text-left px-4 py-3.5 rounded-xl transition duration-300 font-medium text-sm ${activeTab === tab.id ? 'bg-stone-900 text-white font-bold tracking-widest uppercase text-xs' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <Icon size={18} className={activeTab === tab.id ? 'text-white' : 'text-stone-400'} /> {tab.label}
                                            </div>
                                            {tab.badge > 0 && (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white text-stone-900' : 'bg-stone-900 text-white'}`}>
                                                    {tab.badge}
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                            </nav>
                        </div>
                    </div>

                    <div className="md:w-3/4 lg:w-4/5 pb-24">

                        {activeTab === 'dashboard' && (
                            <div className="space-y-12 animate-fade-in">
                                <div className="flex flex-wrap justify-between items-end gap-4">
                                    <h2 className="text-3xl font-light text-stone-900">Dashboard <span className="font-serif italic font-bold">Overview</span></h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                                    {/* 🔥 FIX: Added Total Stock here */}
                                    <div className="bg-stone-50 rounded-3xl p-8 border border-stone-100 hover:border-stone-900 transition-colors group cursor-pointer" onClick={() => setActiveTab('products')}>
                                        <FiBox size={24} className="text-stone-400 mb-6 group-hover:text-stone-900 transition-colors" />
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="text-4xl font-light text-stone-900 mb-1">{products.length}</h3>
                                            <span className="text-sm font-bold text-stone-400">({totalStock} pcs)</span>
                                        </div>
                                        <p className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Active Pieces & Total Stock</p>
                                    </div>

                                    <div className="bg-stone-50 rounded-3xl p-8 border border-stone-100 hover:border-stone-900 transition-colors group cursor-pointer" onClick={() => setActiveTab('orders')}>
                                        <FiShoppingBag size={24} className="text-stone-400 mb-6 group-hover:text-stone-900 transition-colors" />
                                        <h3 className="text-4xl font-light text-stone-900 mb-1">{orders.length}</h3>
                                        <p className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Total Orders</p>
                                    </div>

                                    <div className="bg-stone-50 rounded-3xl p-8 border border-stone-100 hover:border-stone-900 transition-colors group cursor-pointer" onClick={() => setActiveTab('customers')}>
                                        <FiUsers size={24} className="text-stone-400 mb-6 group-hover:text-stone-900 transition-colors" />
                                        {/* 🔥 FIX: Uses dynamic customers length */}
                                        <h3 className="text-4xl font-light text-stone-900 mb-1">{dynamicCustomers.length}</h3>
                                        <p className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Clientele</p>
                                    </div>

                                    <div className="bg-stone-50 rounded-3xl p-8 border border-stone-100 hover:border-stone-900 transition-colors group">
                                        <FiTag size={24} className="text-stone-400 mb-6 group-hover:text-stone-900 transition-colors" />
                                        <h3 className="text-4xl font-light text-stone-900 mb-1">{convertPrice(totalRevenue)}</h3>
                                        <p className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Gross Revenue</p>
                                    </div>

                                    {/* 🔥 FIX: New Card for Shipping Collected */}
                                    <div className="bg-stone-50 rounded-3xl p-8 border border-stone-100 hover:border-stone-900 transition-colors group">
                                        <FiTruck size={24} className="text-stone-400 mb-6 group-hover:text-stone-900 transition-colors" />
                                        <h3 className="text-2xl font-light text-stone-900 mb-1">{convertPrice(totalShippingCollected)}</h3>
                                        <p className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Shipping Collected</p>
                                    </div>

                                    {/* 🔥 FIX: New Card for Tax Collected */}
                                    <div className="bg-stone-50 rounded-3xl p-8 border border-stone-100 hover:border-stone-900 transition-colors group">
                                        <FiTag size={24} className="text-stone-400 mb-6 group-hover:text-stone-900 transition-colors" />
                                        <h3 className="text-2xl font-light text-stone-900 mb-1">{convertPrice(totalTaxCollected)}</h3>
                                        <p className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Tax Collected</p>
                                    </div>

                                </div>
                            </div>
                        )}

                        {activeTab === 'products' && (
                            <div className="animate-fade-in space-y-8">
                                <div className="flex justify-between items-center border-b border-stone-200 pb-4">
                                    <h2 className="text-2xl font-light text-stone-900">Catalog <span className="font-serif italic font-bold">Management</span></h2>
                                    <button
                                        onClick={() => openProductModal(null)}
                                        className="bg-stone-900 text-white text-[10px] font-bold tracking-widest uppercase px-6 py-3 rounded-full flex items-center gap-2 hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/10"
                                    >
                                        <FiPlus size={14} /> Add Piece
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b-2 border-stone-900">
                                                <th className="py-4 pr-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Piece</th>
                                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Status</th>
                                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Price</th>
                                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Stock</th>
                                                <th className="py-4 pl-4 font-bold tracking-widest uppercase text-[10px] text-stone-400 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-stone-600">
                                            {products.map(product => (
                                                <tr key={product.id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                                    <td className="py-4 pr-4 flex items-center gap-4">
                                                        <div className="w-12 h-16 bg-stone-100 rounded-md overflow-hidden flex-shrink-0 border border-stone-200/50">
                                                            {product.images && product.images.length > 0 ? (
                                                                <img src={product.images[0]} className="w-full h-full object-cover" alt="" />
                                                            ) : (
                                                                <FiImage className="w-full h-full p-4 text-stone-300" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-stone-900 block">{product.name}</span>
                                                            <span className="text-[10px] font-mono text-stone-400">{product.sku}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full inline-block ${getStatusStyle(product.status)}`}>
                                                            {product.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 font-bold text-stone-900">
                                                        {product.onSale ? (
                                                            <div>
                                                                <span className="text-red-500">{convertPrice(product.salePrice)}</span>
                                                                <span className="text-stone-400 line-through text-xs ml-2">{convertPrice(product.price)}</span>
                                                            </div>
                                                        ) : (
                                                            <span>{convertPrice(product.price)}</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        {/* 🔥 FIX: Out of Stock visual label added */}
                                                        {product.stock <= 0 ? (
                                                            <span className="text-red-500 font-bold bg-red-50 px-2 py-1 rounded">Out of Stock</span>
                                                        ) : (
                                                            <span className={product.stock < 10 ? 'text-orange-500 font-bold' : ''}>
                                                                {product.stock} pcs
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 pl-4 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <button
                                                                onClick={() => openProductModal(product)}
                                                                className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                                                            >
                                                                <FiEdit2 size={12} />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteProduct(product.id)}
                                                                className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                                                            >
                                                                <FiTrash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {products.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="text-center py-10 text-stone-400 text-sm">
                                                        No products found. Create one!
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div className="animate-fade-in space-y-8">
                                <h2 className="text-2xl font-light text-stone-900 border-b border-stone-200 pb-4">Live Order <span className="font-serif italic font-bold">Tracking</span></h2>
                                <div className="overflow-x-auto">
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

                                                // Safe parsing logic
                                                const customerName = order.customerName || (order.shipping ? `${order.shipping.firstName || ''} ${order.shipping.lastName || ''}`.trim() : null) || 'Online User';
                                                const orderDateDisplay = order.created_at || order.orderDate || order.date;
                                                const orderTotal = safePrice(order.total_amount || order.totals?.total || order.total);

                                                // Format ID cleanly
                                                const rawId = order.orderNumber || order.id?.toString();
                                                const displayId = rawId ? (rawId.startsWith('ORD-') ? rawId : `ORD-${rawId.substring(0, 6).toUpperCase()}`) : 'PENDING';

                                                return (
                                                    <tr key={orderKey} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                                        <td className="py-5 pr-4 font-bold text-stone-900 text-xs">
                                                            {displayId}
                                                        </td>
                                                        <td className="py-5 px-4">{customerName}</td>
                                                        <td className="py-5 px-4">
                                                            {safeDate(orderDateDisplay)}
                                                        </td>
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
                        )}

                        {/* CLIENTELE TAB WITH DYNAMIC CALCULATION */}
                        {activeTab === 'customers' && (
                            <div className="animate-fade-in space-y-8">
                                <div className="flex justify-between items-center border-b border-stone-200 pb-4">
                                    <h2 className="text-2xl font-light text-stone-900">Client <span className="font-serif italic font-bold">Directory</span></h2>
                                    <button
                                        onClick={() => openCustomerModalForEdit(null)}
                                        className="bg-stone-900 text-white text-[10px] font-bold tracking-widest uppercase px-6 py-3 rounded-full flex items-center gap-2 hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/10"
                                    >
                                        <FiPlus size={14} /> Add Client
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b-2 border-stone-900">
                                                <th className="py-4 pr-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Client</th>
                                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Contact</th>
                                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Role</th>
                                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Orders</th>
                                                <th className="py-4 pl-4 font-bold tracking-widest uppercase text-[10px] text-stone-400 text-right">Lifetime Value / Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-stone-600">
                                            {dynamicCustomers.map(customer => (
                                                <tr key={customer.id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                                    <td className="py-5 pr-4 cursor-pointer" onClick={() => openCustomerModal(customer)}>
                                                        <p className="font-bold text-stone-900 hover:text-blue-600 transition-colors">{customer.name}</p>
                                                        <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">Joined {new Date(customer.joined || customer.created_at).getFullYear()}</p>
                                                    </td>
                                                    <td className="py-5 px-4">{customer.email}</td>
                                                    <td className="py-5 px-4">
                                                        <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-full ${getStatusStyle(customer.role || 'customer')}`}>
                                                            {customer.role || 'customer'}
                                                        </span>
                                                    </td>
                                                    <td className="py-5 px-4">{customer.orders}</td>
                                                    <td className="py-5 pl-4 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <span className="font-bold text-stone-900 mr-2">{convertPrice(customer.spent || 0)}</span>
                                                            <button
                                                                onClick={() => openCustomerModalForEdit(customer)}
                                                                className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                                                            >
                                                                <FiEdit2 size={12} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => deleteCustomer(e, customer)}
                                                                className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                                                            >
                                                                <FiTrash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {dynamicCustomers.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="text-center py-10 text-stone-400 text-sm">
                                                        No customers found. Click "Add Client" to add manually.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'categories' && (
                            <div className="animate-fade-in space-y-8">
                                <div className="flex justify-between items-center border-b border-stone-200 pb-4">
                                    <h2 className="text-2xl font-light text-stone-900">Curated <span className="font-serif italic font-bold">Collections</span></h2>
                                    <button
                                        onClick={() => openCategoryModal(null)}
                                        className="bg-stone-900 text-white text-[10px] font-bold tracking-widest uppercase px-6 py-3 rounded-full flex items-center gap-2 hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/10"
                                    >
                                        <FiPlus size={14} /> Add Collection
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b-2 border-stone-900">
                                                <th className="py-4 pr-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Collection</th>
                                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Slug</th>
                                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Items</th>
                                                <th className="py-4 pl-4 font-bold tracking-widest uppercase text-[10px] text-stone-400 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-stone-600">
                                            {categories.map(category => (
                                                <tr key={category.id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                                    <td className="py-5 pr-4 flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-100 border border-stone-200">
                                                            {category.image ? (
                                                                <img src={category.image} className="w-full h-full object-cover" alt="" />
                                                            ) : (
                                                                <FiImage className="w-full h-full p-3 text-stone-300" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-stone-900">{category.name}</p>
                                                            <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1 max-w-[200px]">{category.description}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-5 px-4 font-mono text-xs">{category.slug}</td>
                                                    <td className="py-5 px-4">
                                                        {products.filter(p => p.category === category.slug).length} Pieces
                                                    </td>
                                                    <td className="py-5 pl-4 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <button
                                                                onClick={() => openCategoryModal(category)}
                                                                className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                                                            >
                                                                <FiEdit2 size={12} />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteCategory(category.id)}
                                                                className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                                                            >
                                                                <FiTrash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {categories.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-10 text-stone-400 text-sm">
                                                        No collections found. Create one!
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'coupons' && (
                            <div className="animate-fade-in space-y-8">
                                <div className="flex justify-between items-center border-b border-stone-200 pb-4">
                                    <h2 className="text-2xl font-light text-stone-900">Promo <span className="font-serif italic font-bold">Codes</span></h2>
                                    <button
                                        onClick={() => openCouponModal(null)}
                                        className="bg-stone-900 text-white text-[10px] font-bold tracking-widest uppercase px-6 py-3 rounded-full flex items-center gap-2 hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/10"
                                    >
                                        <FiPlus size={14} /> Create Code
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b-2 border-stone-900">
                                                <th className="py-4 pr-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Code</th>
                                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Type & Value</th>
                                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Target</th>
                                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Expires</th>
                                                <th className="py-4 pl-4 font-bold tracking-widest uppercase text-[10px] text-stone-400 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-stone-600">
                                            {coupons.map(coupon => (
                                                <tr key={coupon.id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                                    <td className="py-5 pr-4 font-bold tracking-widest text-stone-900 uppercase">{coupon.code}</td>
                                                    <td className="py-5 px-4 font-bold text-stone-900">
                                                        {coupon.type === 'percent' ? `${coupon.discount}%` : convertPrice(coupon.discount)}
                                                    </td>
                                                    <td className="py-5 px-4">
                                                        <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-full ${coupon.target_role === 'student' ? 'bg-blue-50 text-blue-600' : 'bg-stone-100 text-stone-500'}`}>
                                                            {coupon.target_role === 'student' ? 'Students Only' : 'Everyone'}
                                                        </span>
                                                    </td>
                                                    <td className="py-5 px-4 text-xs">
                                                        {coupon.expires_at ? safeDate(coupon.expires_at).split(',')[0] : 'Never'}
                                                    </td>
                                                    <td className="py-5 pl-4 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <button
                                                                onClick={() => openCouponModal(coupon)}
                                                                className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                                                            >
                                                                <FiEdit2 size={12} />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteCoupon(coupon.id)}
                                                                className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                                                            >
                                                                <FiTrash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {coupons.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="text-center py-10 text-stone-400 text-sm">
                                                        No promo codes active.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'messages' && (
                            <div className="animate-fade-in space-y-8">
                                <h2 className="text-2xl font-light text-stone-900 border-b border-stone-200 pb-4">Client <span className="font-serif italic font-bold">Inquiries</span></h2>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b-2 border-stone-900">
                                                <th className="py-4 pr-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Sender</th>
                                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Subject</th>
                                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Date</th>
                                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Status</th>
                                                <th className="py-4 pl-4 font-bold tracking-widest uppercase text-[10px] text-stone-400 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-stone-600">
                                            {messages.map(msg => (
                                                <tr key={msg.id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                                    <td className="py-5 pr-4">
                                                        <p className={`font-medium ${msg.status === 'unread' ? 'text-stone-900 font-bold' : 'text-stone-700'}`}>
                                                            {msg.sender}
                                                        </p>
                                                    </td>
                                                    <td className={`py-5 px-4 ${msg.status === 'unread' ? 'font-bold text-stone-900' : ''}`}>
                                                        {msg.subject}
                                                    </td>
                                                    <td className="py-5 px-4">
                                                        {safeDate(msg.created_at || msg.date)}
                                                    </td>
                                                    <td className="py-5 px-4">
                                                        <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full inline-block ${getStatusStyle(msg.status)}`}>
                                                            {msg.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-5 pl-4 text-right">
                                                        <button
                                                            onClick={() => viewMessage(msg)}
                                                            className="text-[10px] font-bold tracking-widest uppercase text-stone-500 hover:text-stone-900 border-b border-stone-300 pb-0.5 hover:border-stone-900 transition-colors"
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {messages.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="text-center py-10 text-stone-400 text-sm">
                                                        No new inquiries.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="animate-fade-in max-w-3xl">
                                <h2 className="text-2xl font-light text-stone-900 mb-8 border-b border-stone-200 pb-4">Global <span className="font-serif italic font-bold">Preferences</span></h2>
                                <form onSubmit={handleSettingsSubmit} className="space-y-12">

                                    <div>
                                        <h3 className="text-lg font-bold text-stone-900 mb-6">General Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Maison Name</label>
                                                <input
                                                    required
                                                    type="text"
                                                    value={settingsForm.storeName || ''}
                                                    onChange={e => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                                                    className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm font-bold text-stone-900"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Concierge Email</label>
                                                <input
                                                    required
                                                    type="email"
                                                    value={settingsForm.contactEmail || ''}
                                                    onChange={e => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                                                    className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Default Base Currency</label>
                                                <select
                                                    value={settingsForm.currency || 'USD'}
                                                    onChange={e => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                                                    className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm appearance-none"
                                                >
                                                    <option value="USD">USD ($)</option>
                                                    <option value="EUR">EUR (€)</option>
                                                    <option value="GBP">GBP (£)</option>
                                                    <option value="INR">INR (₹)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-stone-100">
                                        <h3 className="text-lg font-bold text-stone-900 mb-6">Payment Gateways & APIs</h3>

                                        <div className="mb-8 bg-stone-50 p-6 rounded-2xl border border-stone-200">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <h4 className="text-sm font-bold text-stone-900">Stripe (Credit/Debit Cards)</h4>
                                                    <p className="text-xs text-stone-500 mt-1">Accept global card payments.</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={settingsForm.enableStripe || false}
                                                        onChange={e => setSettingsForm({ ...settingsForm, enableStripe: e.target.checked })}
                                                    />
                                                    <div className="w-11 h-6 bg-stone-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
                                                </label>
                                            </div>
                                            {settingsForm.enableStripe && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                                    <div>
                                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Publishable Key</label>
                                                        <input type="text" value={settingsForm.stripePublicKey || ''} onChange={e => setSettingsForm({ ...settingsForm, stripePublicKey: e.target.value })} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 text-sm font-mono" placeholder="pk_test_..." />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Secret Key</label>
                                                        <input type="password" value={settingsForm.stripeSecretKey || ''} onChange={e => setSettingsForm({ ...settingsForm, stripeSecretKey: e.target.value })} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 text-sm font-mono" placeholder="sk_test_..." />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-8 bg-stone-50 p-6 rounded-2xl border border-stone-200">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <h4 className="text-sm font-bold text-stone-900">Razorpay (UPI & Indian Cards)</h4>
                                                    <p className="text-xs text-stone-500 mt-1">Best for Indian customers via UPI & Netbanking.</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={settingsForm.enableRazorpay || false}
                                                        onChange={e => setSettingsForm({ ...settingsForm, enableRazorpay: e.target.checked })}
                                                    />
                                                    <div className="w-11 h-6 bg-stone-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
                                                </label>
                                            </div>
                                            {settingsForm.enableRazorpay && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                                    <div>
                                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Key ID</label>
                                                        <input type="text" value={settingsForm.razorpayKeyId || ''} onChange={e => setSettingsForm({ ...settingsForm, razorpayKeyId: e.target.value })} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 text-sm font-mono" placeholder="rzp_test_..." />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Key Secret</label>
                                                        <input type="password" value={settingsForm.razorpayKeySecret || ''} onChange={e => setSettingsForm({ ...settingsForm, razorpayKeySecret: e.target.value })} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 text-sm font-mono" placeholder="..." />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Manual Bank */}
                                        <div className="mb-8 bg-stone-50 p-6 rounded-2xl border border-stone-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-sm font-bold text-stone-900">Direct Bank Transfer</h4>
                                                    <p className="text-xs text-stone-500 mt-1">Allow customers to manually wire funds.</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" checked={settingsForm.enableManualBank || false} onChange={e => setSettingsForm({ ...settingsForm, enableManualBank: e.target.checked })} />
                                                    <div className="w-11 h-6 bg-stone-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Cash on Delivery (COD) */}
                                        <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-sm font-bold text-stone-900">Cash on Delivery (COD)</h4>
                                                    <p className="text-xs text-stone-500 mt-1">Allow customers to pay in cash upon delivery.</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" checked={settingsForm.enableCOD || false} onChange={e => setSettingsForm({ ...settingsForm, enableCOD: e.target.checked })} />
                                                    <div className="w-11 h-6 bg-stone-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-stone-100">
                                        <h3 className="text-lg font-bold text-stone-900 mb-6">Taxes & Logistics</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Global Tax Rate (%)</label>
                                                <input required type="number" step="0.01" value={settingsForm.taxRate || 0} onChange={e => setSettingsForm({ ...settingsForm, taxRate: Number(e.target.value) })} className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm font-mono" placeholder="e.g. 18 for 18%" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Free Shipping Threshold (INR)</label>
                                                <input required type="number" value={settingsForm.freeShippingAmount || 0} onChange={e => setSettingsForm({ ...settingsForm, freeShippingAmount: Number(e.target.value) })} className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm font-mono" />
                                            </div>
                                        </div>

                                        <h4 className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mt-8 mb-4">Shipping Zones (Base Rates in INR)</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                                            <div>
                                                <label className="block text-xs font-medium text-stone-600 mb-2">India</label>
                                                <input required type="number" value={settingsForm.shippingIndia || 0} onChange={e => setSettingsForm({ ...settingsForm, shippingIndia: Number(e.target.value) })} className="w-full px-4 py-3 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-stone-600 mb-2">Tier 1 (US/UK/EU)</label>
                                                <input required type="number" value={settingsForm.shippingTier1 || 0} onChange={e => setSettingsForm({ ...settingsForm, shippingTier1: Number(e.target.value) })} className="w-full px-4 py-3 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-stone-600 mb-2">Rest of World</label>
                                                <input required type="number" value={settingsForm.shippingRow || 0} onChange={e => setSettingsForm({ ...settingsForm, shippingRow: Number(e.target.value) })} className="w-full px-4 py-3 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm" />
                                            </div>
                                        </div>

                                        <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <h4 className="text-sm font-bold text-stone-900">Shiprocket Integration</h4>
                                                    <p className="text-xs text-stone-500 mt-1">Automatically push orders to Shiprocket.</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={settingsForm.enableShiprocket || false}
                                                        onChange={e => setSettingsForm({ ...settingsForm, enableShiprocket: e.target.checked })}
                                                    />
                                                    <div className="w-11 h-6 bg-stone-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
                                                </label>
                                            </div>
                                            {settingsForm.enableShiprocket && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                                    <div className="md:col-span-2">
                                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Shiprocket Email</label>
                                                        <input type="email" value={settingsForm.shiprocketEmail || ''} onChange={e => setSettingsForm({ ...settingsForm, shiprocketEmail: e.target.value })} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 text-sm" placeholder="admin@shophub.com" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Shiprocket Password</label>
                                                        <input type="password" value={settingsForm.shiprocketPassword || ''} onChange={e => setSettingsForm({ ...settingsForm, shiprocketPassword: e.target.value })} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 text-sm" placeholder="••••••••" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Pickup Location Name</label>
                                                        <input type="text" value={settingsForm.shiprocketPickup || ''} onChange={e => setSettingsForm({ ...settingsForm, shiprocketPickup: e.target.value })} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 text-sm" placeholder="Primary" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-stone-100 flex justify-end">
                                        <button
                                            type="submit"
                                            className="bg-stone-900 text-white text-xs font-bold tracking-widest uppercase px-10 py-4 rounded-full hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/10"
                                        >
                                            Save All Settings
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                    </div>
                </div>
            </main>

  {/* --- MODALS --- */}

            {/* ORDER PREVIEW MODAL */}
            {isOrderModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto custom-scrollbar">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] flex-shrink-0 mt-12 mb-24">
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

                                        {/* 🔥 FIX: Added Dynamic Discount Display here */}
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
                                    {/* 🔥 FIX: ADDED PAYMENT METHOD DISPLAY IN ADMIN PANEL */}
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

            {/* CUSTOMER PREVIEW MODAL */}
            {isCustomerModalOpen && selectedCustomer && (
                <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto custom-scrollbar">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-stone-100 flex-shrink-0 mt-12 mb-24">
                        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                            <h3 className="text-xl font-light text-stone-900">Client <span className="font-serif italic font-bold">Profile</span></h3>
                            <button
                                onClick={() => setIsCustomerModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors"
                            >
                                <FiX size={16} />
                            </button>
                        </div>
                        <div className="p-8">
                            <div className="flex items-center gap-5 mb-8">
                                <div className="w-16 h-16 bg-stone-900 text-white rounded-full flex items-center justify-center font-serif italic font-bold text-2xl">
                                    {selectedCustomer.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-stone-900">{selectedCustomer.name}</h4>
                                    <p className="text-sm text-stone-500">{selectedCustomer.email}</p>
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mt-1">
                                        Client since {new Date(selectedCustomer.joined || selectedCustomer.created_at).getFullYear()}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-stone-50 p-5 rounded-2xl border border-stone-100">
                                    <FiShoppingBag className="text-stone-400 mb-2" size={16} />
                                    <p className="text-2xl font-light text-stone-900 mb-1">{selectedCustomer.orders}</p>
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Total Orders</p>
                                </div>
                                <div className="bg-stone-50 p-5 rounded-2xl border border-stone-100">
                                    <FiTag className="text-stone-400 mb-2" size={16} />
                                    <p className="text-2xl font-light text-stone-900 mb-1">{convertPrice(safePrice(selectedCustomer.spent))}</p>
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Lifetime Value</p>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 border-t border-stone-100">
                                <a
                                    href={`mailto:${selectedCustomer.email}`}
                                    className="px-6 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 text-xs font-bold tracking-widest uppercase shadow-lg shadow-stone-900/10 transition-colors flex items-center gap-2"
                                >
                                    <FiMail size={14} /> Contact Client
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD OR EDIT CLIENT MODAL */}
            {isNewCustomerModalOpen && (
                <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-50 flex items-start justify-center p-4 overflow-y-auto custom-scrollbar">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-stone-100 flex-shrink-0 mt-12 mb-24">
                        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                            <h3 className="text-xl font-light text-stone-900">{customerForm.id ? 'Edit' : 'Add'} <span className="font-serif italic font-bold">Client</span></h3>
                            <button
                                onClick={() => setIsNewCustomerModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors"
                            >
                                <FiX size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleNewCustomerSubmit} className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Full Name *</label>
                                <input
                                    required type="text" value={customerForm.name}
                                    onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm font-bold text-stone-900"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Email Address *</label>
                                <input
                                    required type="email" value={customerForm.email}
                                    onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Role</label>
                                    <select
                                        value={customerForm.role}
                                        onChange={e => setCustomerForm({ ...customerForm, role: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm"
                                    >
                                        <option value="customer">Customer</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Orders Made</label>
                                    <input
                                        type="number" value={customerForm.orders}
                                        onChange={e => setCustomerForm({ ...customerForm, orders: Number(e.target.value) })}
                                        className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Total Spent (INR)</label>
                                <input
                                    type="number" value={customerForm.spent}
                                    onChange={e => setCustomerForm({ ...customerForm, spent: Number(e.target.value) })}
                                    className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm font-bold text-stone-900"
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3 border-t border-stone-100 mt-6">
                                <button type="button" onClick={() => setIsNewCustomerModalOpen(false)} className="px-6 py-3 border border-stone-200 rounded-full text-stone-900 hover:bg-stone-50 text-xs font-bold tracking-widest uppercase transition-colors">Cancel</button>
                                <button type="submit" className="px-8 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 text-xs font-bold tracking-widest uppercase shadow-lg shadow-stone-900/10 transition-colors">Save Client</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PRODUCT CRUD MODAL */}
            {isProductModalOpen && (
                <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto custom-scrollbar" onPaste={(e) => handlePaste(e, false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] flex-shrink-0 mt-12 mb-24">
                        <div className="px-8 py-5 border-b border-stone-100 flex justify-between items-center bg-stone-50/50 sticky top-0 z-10">
                            <div>
                                <h3 className="text-xl font-light text-stone-900">{selectedProduct ? 'Edit' : 'Curate'} <span className="font-serif italic font-bold">Piece</span></h3>
                                <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mt-1">Full Management Interface</p>
                            </div>
                            <button
                                onClick={() => setIsProductModalOpen(false)}
                                className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors shadow-sm"
                            >
                                <FiX size={18} />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-8 hide-scrollbar">
                            <form onSubmit={handleProductSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                {/* LEFT COLUMN */}
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-bold tracking-widest uppercase text-stone-900 border-b border-stone-200 pb-2">Primary Details</h4>
                                    <div>
                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Piece Name *</label>
                                        <input
                                            required
                                            type="text"
                                            value={productForm.name}
                                            onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm font-bold text-stone-900"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Reference SKU</label>
                                            <input
                                                type="text"
                                                value={productForm.sku}
                                                onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                                                className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Collection</label>
                                            <select
                                                value={productForm.category}
                                                onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                                                className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm appearance-none"
                                            >
                                                <option value="">Select Collection</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Description</label>
                                        <textarea
                                            rows="4"
                                            value={productForm.description || ''}
                                            onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm resize-none"
                                        ></textarea>
                                    </div>

                                    {/* VARIANTS SECTION */}
                                    <h4 className="text-[10px] font-bold tracking-widest uppercase text-stone-900 border-b border-stone-200 pb-2 mt-8">Variants (Optional)</h4>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Colors (Hex/Name, comma separated)</label>
                                            <input
                                                type="text"
                                                value={productForm.colors || ''}
                                                onChange={e => setProductForm({ ...productForm, colors: e.target.value })}
                                                className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm"
                                                placeholder="#000000, #FFFFFF, Red"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Sizes (comma separated)</label>
                                            <input
                                                type="text"
                                                value={productForm.sizes || ''}
                                                onChange={e => setProductForm({ ...productForm, sizes: e.target.value })}
                                                className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm"
                                                placeholder="S, M, L, XL"
                                            />
                                        </div>
                                    </div>

                                    <h4 className="text-[10px] font-bold tracking-widest uppercase text-stone-900 border-b border-stone-200 pb-2 mt-8">Pricing & Inventory</h4>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Base Price (INR) *</label>
                                            <input
                                                required
                                                type="number"
                                                step="0.01"
                                                value={productForm.price || 0}
                                                onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })}
                                                className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Stock Level (Pcs) *</label>
                                            <input
                                                required
                                                type="number"
                                                value={productForm.stock || 0}
                                                onChange={e => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                                                className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 items-start">
                                        <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-900">Put on Sale</label>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={productForm.onSale || false}
                                                        onChange={e => setProductForm({ ...productForm, onSale: e.target.checked })}
                                                    />
                                                    <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-stone-900"></div>
                                                </label>
                                            </div>
                                            {productForm.onSale && (
                                                <div className="animate-fade-in mt-2">
                                                    <label className="block text-[9px] font-bold tracking-widest uppercase text-red-50 mb-1">Sale Price (INR)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={productForm.salePrice || 0}
                                                        onChange={e => setProductForm({ ...productForm, salePrice: Number(e.target.value) })}
                                                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-md focus:outline-none focus:border-red-500 text-sm font-bold text-red-600"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Product Status</label>
                                            <select
                                                value={productForm.status || 'active'}
                                                onChange={e => setProductForm({ ...productForm, status: e.target.value })}
                                                className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm appearance-none font-bold"
                                            >
                                                <option value="active">Active (Live)</option>
                                                <option value="draft">Draft (Hidden)</option>
                                                <option value="archived">Archived</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: Media */}
                                <div>
                                    <h4 className="text-[10px] font-bold tracking-widest uppercase text-stone-900 border-b border-stone-200 pb-2 mb-6">Media Gallery</h4>
                                    <div
                                        className="border-2 border-dashed border-stone-200 rounded-2xl p-10 text-center bg-stone-50 hover:bg-stone-100 hover:border-stone-300 transition-colors cursor-pointer flex flex-col items-center justify-center mb-6"
                                        onClick={() => productFileInputRef.current.click()}
                                    >
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                            <FiUploadCloud size={24} className="text-stone-400" />
                                        </div>
                                        <p className="text-sm font-bold text-stone-900 mb-1">Click to Upload</p>
                                        <p className="text-xs text-stone-500 mb-3">Or <kbd className="bg-white border border-stone-200 px-2 py-0.5 rounded-md font-mono text-[10px]">Ctrl+V</kbd> anywhere to paste.</p>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="hidden"
                                            ref={productFileInputRef}
                                            onChange={(e) => handleImageUpload(e, false)}
                                        />
                                        <span className="bg-stone-900 text-white text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-full">Select Files</span>
                                    </div>
                                    {productForm.images.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-3">Selected Images ({productForm.images.length})</p>
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                                {productForm.images.map((imgSrc, idx) => (
                                                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-stone-200 group bg-stone-100">
                                                        <img src={imgSrc} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); removeProductImage(idx); }}
                                                            className="absolute top-2 right-2 w-6 h-6 bg-white/90 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shadow-sm"
                                                        >
                                                            <FiTrash2 size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="lg:col-span-2 pt-6 flex justify-end gap-4 border-t border-stone-100 mt-4 sticky bottom-0 bg-white/90 backdrop-blur-md py-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsProductModalOpen(false)}
                                        className="px-8 py-3.5 border border-stone-200 rounded-full text-stone-900 hover:bg-stone-50 text-xs font-bold tracking-widest uppercase transition-colors"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-10 py-3.5 bg-stone-900 text-white rounded-full hover:bg-stone-800 text-xs font-bold tracking-widest uppercase shadow-xl shadow-stone-900/20 transition-colors flex items-center gap-2"
                                    >
                                        <FiCheck size={16} /> Save Product
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* UPGRADED CATEGORY MODAL WITH ITEM SELECTION */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-50 flex items-start justify-center p-4 overflow-y-auto custom-scrollbar" onPaste={(e) => handlePaste(e, true)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-stone-100 flex flex-col max-h-[90vh] flex-shrink-0 mt-12 mb-24">
                        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                            <h3 className="text-xl font-light text-stone-900">{selectedCategory ? 'Edit' : 'New'} <span className="font-serif italic font-bold">Collection</span></h3>
                            <button
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors"
                            >
                                <FiX size={16} />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto hide-scrollbar">
                            <form onSubmit={handleCategorySubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Collection Name *</label>
                                        <input
                                            required
                                            type="text"
                                            value={categoryForm.name || ''}
                                            onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm font-bold text-stone-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">URL Slug *</label>
                                        <input
                                            required
                                            type="text"
                                            value={categoryForm.slug || ''}
                                            onChange={e => setCategoryForm({ ...categoryForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                            className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Description</label>
                                        <textarea
                                            rows="3"
                                            value={categoryForm.description || ''}
                                            onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm resize-none"
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Cover Image</label>
                                        {categoryForm.image ? (
                                            <div className="relative aspect-square rounded-2xl overflow-hidden border border-stone-200 group">
                                                <img src={categoryForm.image} className="w-full h-full object-cover" alt="" />
                                                <button
                                                    type="button"
                                                    onClick={() => setCategoryForm({ ...categoryForm, image: '' })}
                                                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shadow-sm"
                                                >
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                                className="border-2 border-dashed border-stone-200 rounded-2xl aspect-[3/2] bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer flex flex-col items-center justify-center text-center p-6"
                                                onClick={() => categoryFileInputRef.current.click()}
                                            >
                                                <FiImage size={32} className="text-stone-300 mb-4" />
                                                <p className="text-xs font-bold text-stone-900 mb-1">Click or Paste (Ctrl+V)</p>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    ref={categoryFileInputRef}
                                                    onChange={(e) => handleImageUpload(e, true)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ADD ITEMS VISUALLY TO COLLECTION */}
                                <div className="md:col-span-2 pt-2">
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-3">Add Products to Collection</label>
                                    <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-xl p-3 bg-stone-50 space-y-1">
                                        {products.map(p => (
                                            <label key={p.id} className="flex items-center gap-4 p-2 hover:bg-stone-100 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-stone-200">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCategoryProducts.includes(p.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedCategoryProducts([...selectedCategoryProducts, p.id]);
                                                        else setSelectedCategoryProducts(selectedCategoryProducts.filter(id => id !== p.id));
                                                    }}
                                                    className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
                                                />
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-10 bg-white border border-stone-200 rounded overflow-hidden flex-shrink-0">
                                                        <img src={p.images?.[0] || p.image} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="text-xs font-bold text-stone-900">{p.name}</span>
                                                </div>
                                            </label>
                                        ))}
                                        {products.length === 0 && <p className="text-xs text-stone-400 p-2 text-center py-6">No products available in catalog yet.</p>}
                                    </div>
                                    <p className="text-[10px] text-stone-500 mt-2 text-right">{selectedCategoryProducts.length} pieces selected</p>
                                </div>

                                <div className="md:col-span-2 pt-4 flex justify-end gap-3 border-t border-stone-100 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsCategoryModalOpen(false)}
                                        className="px-6 py-3 border border-stone-200 rounded-full text-stone-900 hover:bg-stone-50 text-xs font-bold tracking-widest uppercase transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 text-xs font-bold tracking-widest uppercase shadow-lg shadow-stone-900/10 transition-colors"
                                    >
                                        Save Collection
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔥 UPDATED COUPON MODAL */}
            {isCouponModalOpen && (
                <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-50 flex items-start justify-center p-4 overflow-y-auto custom-scrollbar">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-stone-100 flex-shrink-0 mt-12 mb-24">
                        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                            <h3 className="text-xl font-light text-stone-900">{selectedCoupon ? 'Edit' : 'New'} <span className="font-serif italic font-bold">Promo Code</span></h3>
                            <button
                                onClick={() => setIsCouponModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors"
                            >
                                <FiX size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleCouponSubmit} className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Promo Code *</label>
                                <input
                                    required
                                    type="text"
                                    value={couponForm.code}
                                    onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                                    className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm font-bold text-stone-900 tracking-widest uppercase"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Discount Type *</label>
                                    <select
                                        value={couponForm.type}
                                        onChange={e => setCouponForm({ ...couponForm, type: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm appearance-none"
                                    >
                                        <option value="percent">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (INR)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Value *</label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        value={couponForm.discount}
                                        onChange={e => setCouponForm({ ...couponForm, discount: Number(e.target.value) })}
                                        className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm font-bold"
                                    />
                                </div>
                            </div>

                            {/* 🔥 NEW: Expiry & Target Role Fields */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Expiration Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={couponForm.expires_at || ''}
                                        onChange={e => setCouponForm({ ...couponForm, expires_at: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Who can use this?</label>
                                    <select
                                        value={couponForm.target_role || 'all'}
                                        onChange={e => setCouponForm({ ...couponForm, target_role: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm appearance-none"
                                    >
                                        <option value="all">Everyone</option>
                                        <option value="student">Verified Students Only (.edu)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-stone-100 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsCouponModalOpen(false)}
                                    className="px-6 py-3 border border-stone-200 rounded-full text-stone-900 hover:bg-stone-50 text-xs font-bold tracking-widest uppercase transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 text-xs font-bold tracking-widest uppercase shadow-lg shadow-stone-900/10 transition-colors"
                                >
                                    Save Code
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Message View Modal */}
            {isMessageModalOpen && selectedMessage && (
                <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto custom-scrollbar">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-stone-100 flex-shrink-0 mt-12 mb-24">
                        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                            <h3 className="text-xl font-light text-stone-900">Client <span className="font-serif italic font-bold">Inquiry</span></h3>
                            <button
                                onClick={() => setIsMessageModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors"
                            >
                                <FiX size={16} />
                            </button>
                        </div>
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-8 pb-6 border-b border-stone-100">
                                <div>
                                    <p className="text-sm font-bold text-stone-900">{selectedMessage.sender}</p>
                                    <p className="text-sm text-stone-500">{selectedMessage.email}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-stone-400 font-medium">
                                        {safeDate(selectedMessage.created_at || selectedMessage.date)}
                                    </p>
                                </div>
                            </div>
                            <div className="mb-6">
                                <h4 className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Subject</h4>
                                <p className="font-medium text-stone-900">{selectedMessage.subject}</p>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Message</h4>
                                <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap bg-stone-50 p-6 rounded-2xl border border-stone-100">
                                    {selectedMessage.message}
                                </p>
                            </div>
                            <div className="pt-8 mt-8 flex justify-end gap-3 border-t border-stone-100">
                                <a
                                    href={`mailto:${selectedMessage.email}?subject=RE: ${selectedMessage.subject}`}
                                    className="px-8 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 text-xs font-bold tracking-widest uppercase shadow-lg shadow-stone-900/10 transition-colors"
                                >
                                    Reply via Email
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
