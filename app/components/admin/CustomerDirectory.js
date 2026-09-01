'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../utils/supabase';
import { useGlobalCurrency } from '../../context/CurrencyContext';
import toast from 'react-hot-toast';
import {
    FiPlus, FiEdit2, FiTrash2, FiX, FiShoppingBag, FiTag, FiMail
} from 'react-icons/fi';

const generateId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

const safePrice = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
};

export default function CustomerDirectory() {
    const { convertPrice } = useGlobalCurrency() || { convertPrice: (val) => `₹${val}` };

    const [customers, setCustomers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
    const [customerForm, setCustomerForm] = useState({
        id: null, name: '', email: '', role: 'customer', orders: 0, spent: 0, isProfile: false
    });

    // 🔥 1. Safe Fetching
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 100% Safe Fetching (No 400 Errors)
                const { data: realOrders } = await supabase.from('orders').select('*');
                if (realOrders) setOrders(realOrders);

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

                setCustomers(combinedClients);
            } catch (error) {
                console.error("Data Fetch Error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // 🔥 2. BULLETPROOF CALCULATION (Exact Matching)
    const dynamicCustomers = useMemo(() => {
        return customers.map(cust => {

            // हर कस्टमर के लिए उसके ऑर्डर्स ढूँढना (User ID और Email दोनों से)
            const myOrders = orders.filter(o => {
                const matchUserId = o.user_id && o.user_id === cust.id;
                const matchEmail = o.email && cust.email && o.email.toLowerCase() === cust.email.toLowerCase();
                const matchShippingEmail = o.shipping?.email && cust.email && o.shipping.email.toLowerCase() === cust.email.toLowerCase();

                return matchUserId || matchEmail || matchShippingEmail;
            });

            const orderCount = myOrders.length;
            const totalSpent = myOrders.reduce((sum, o) => sum + safePrice(o.total_amount || o.totals?.total), 0);

            return {
                ...cust,
                orders: orderCount > 0 ? orderCount : (cust.orders || 0),
                spent: totalSpent > 0 ? totalSpent : (cust.spent || 0)
            };
        });
    }, [customers, orders]);

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'admin': return 'bg-stone-900 text-white';
            default: return 'bg-stone-100 text-stone-900';
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

        const baseSpentAmount = Number(customerForm.spent);
        const nameParts = customerForm.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        if (customerForm.id) {
            if (customerForm.isProfile) {
                const { error } = await supabase.from('profiles').update({
                    first_name: firstName,
                    last_name: lastName,
                    email: customerForm.email,
                    role: customerForm.role
                }).eq('id', customerForm.id);
                if (error) return toast.error("Profile Update Failed");
            } else {
                const { error } = await supabase.from('customers').update({
                    name: customerForm.name,
                    email: customerForm.email,
                    orders: customerForm.orders,
                    spent: baseSpentAmount
                }).eq('id', customerForm.id);
                if (error) return toast.error("Customer Update Failed");
            }

            setCustomers(customers.map(c => c.id === customerForm.id ? {
                ...c, name: customerForm.name, email: customerForm.email, role: customerForm.role, orders: customerForm.orders, spent: baseSpentAmount
            } : c));
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
            if (error) return toast.error("Database Insert Failed");

            const newCustObj = data && data.length > 0 ? data[0] : insertCustomer;
            setCustomers([newCustObj, ...customers]);
            toast.success("Client added successfully!");
        }

        setIsNewCustomerModalOpen(false);
    };

    const deleteCustomer = async (e, cust) => {
        e.stopPropagation();
        if (window.confirm(`Delete client "${cust.name}" permanently?`)) {
            if (cust.isProfile) {
                const { error } = await supabase.from('profiles').delete().eq('id', cust.id);
                if (error) return toast.error("Failed to delete profile.");
            } else {
                const { error } = await supabase.from('customers').delete().eq('id', cust.id);
                if (error) return toast.error("Failed to delete customer.");
            }

            setCustomers(customers.filter(c => c.id !== cust.id));
            toast.success("Client removed!");
        }
    };

    if (isLoading) {
        return <div className="text-stone-400 text-sm animate-pulse pt-10">Loading Clientele...</div>;
    }

    return (
        <>
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

                <div className="overflow-x-auto pb-10">
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
                                    <td className="py-5 pr-4 cursor-pointer" onClick={() => { setSelectedCustomer(customer); setIsCustomerModalOpen(true); }}>
                                        <p className="font-bold text-stone-900 hover:text-blue-600 transition-colors">{customer.name}</p>
                                        <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">Joined {new Date(customer.joined || customer.created_at || Date.now()).getFullYear()}</p>
                                    </td>
                                    <td className="py-5 px-4">{customer.email}</td>
                                    <td className="py-5 px-4">
                                        <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-full ${getStatusStyle(customer.role || 'customer')}`}>
                                            {customer.role || 'customer'}
                                        </span>
                                    </td>
                                    <td className="py-5 px-4 font-medium text-stone-900">{customer.orders}</td>
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

            {/* 🔥 MODALS */}
            {isCustomerModalOpen && selectedCustomer && (
                <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-[100] flex items-start justify-center p-4 pt-16 overflow-y-auto pb-24 custom-scrollbar">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-stone-100 animate-fade-in">
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
                                        Client since {new Date(selectedCustomer.joined || selectedCustomer.created_at || Date.now()).getFullYear()}
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

            {isNewCustomerModalOpen && (
                <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-[100] flex items-start justify-center p-4 pt-16 overflow-y-auto pb-24 custom-scrollbar">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-stone-100 animate-fade-in">
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
                                        className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm appearance-none"
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
                                        className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm font-bold"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Total Spent (Base Currency)</label>
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
        </>
    );
}