'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { useGlobalCurrency } from '../../context/CurrencyContext';
import toast from 'react-hot-toast';
import {
    FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiClock, FiTag, FiActivity
} from 'react-icons/fi';

const safeDate = (dateString) => {
    if (!dateString) return 'Never Expires';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? 'Never Expires' : d.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    }).toUpperCase();
};

export default function CouponManagement() {
    const { convertPrice } = useGlobalCurrency() || { convertPrice: (val) => `₹${val}` };

    const [coupons, setCoupons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState(null);

    const [couponForm, setCouponForm] = useState({
        code: '', type: 'percent', discount: 0, expires_at: '', target_role: 'all'
    });

    // 🔥 SAFE FETCH
    useEffect(() => {
        const fetchCoupons = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase.from('coupons').select('*');
                if (data && !error) {
                    const sortedCoupons = data.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                    setCoupons(sortedCoupons);
                }
            } catch (error) {
                console.error("Coupon Fetch Error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCoupons();
    }, []);

    const openCouponModal = (coupon = null) => {
        if (coupon) {
            setSelectedCoupon(coupon);
            setCouponForm({
                code: coupon.code || '',
                type: coupon.type || 'percent',
                discount: Number(coupon.discount || 0),
                expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
                target_role: coupon.target_role || 'all'
            });
        } else {
            setSelectedCoupon(null);
            setCouponForm({
                code: '', type: 'percent', discount: 0, expires_at: '', target_role: 'all'
            });
        }
        setIsCouponModalOpen(true);
    };

    const handleCouponSubmit = async (e) => {
        e.preventDefault();

        const finalData = {
            code: couponForm.code.toUpperCase(),
            type: couponForm.type,
            discount: Number(couponForm.discount),
            target_role: couponForm.target_role,
            expires_at: couponForm.expires_at ? new Date(couponForm.expires_at).toISOString() : null
        };

        if (selectedCoupon) {
            const { error } = await supabase.from('coupons').update(finalData).eq('id', selectedCoupon.id);
            if (error) return toast.error("Update Failed: " + error.message);

            setCoupons(coupons.map(c => c.id === selectedCoupon.id ? { ...c, ...finalData } : c));
            toast.success("Promo code updated successfully!");
        } else {
            const { data, error } = await supabase.from('coupons').insert([finalData]).select();
            if (error) return toast.error("Insert Failed: " + error.message);

            const newObj = data && data.length > 0 ? data[0] : finalData;
            setCoupons([newObj, ...coupons]);
            toast.success("Promo code created securely!");
        }
        setIsCouponModalOpen(false);
    };

    const deleteCoupon = async (id) => {
        if (window.confirm("Are you sure you want to permanently delete this promo code?")) {
            const { error } = await supabase.from('coupons').delete().eq('id', id);
            if (error) return toast.error("Delete Failed: " + error.message);

            setCoupons(coupons.filter(c => c.id !== id));
            toast.success("Promo code removed!");
        }
    };

    if (isLoading) {
        return <div className="text-stone-400 text-sm animate-pulse pt-10">Loading Promo Campaigns...</div>;
    }

    return (
        <>
            <div className="animate-fade-in space-y-8">
                <div className="flex justify-between items-center border-b border-stone-200 pb-4">
                    <h2 className="text-2xl font-light text-stone-900">Promo <span className="font-serif italic font-bold">Campaigns</span></h2>
                    <button
                        onClick={() => openCouponModal(null)}
                        className="bg-stone-900 text-white text-[10px] font-bold tracking-widest uppercase px-6 py-3 rounded-full flex items-center gap-2 hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/10"
                    >
                        <FiPlus size={14} /> Create Campaign
                    </button>
                </div>

                <div className="overflow-x-auto pb-10">
                    <table className="min-w-full text-left text-sm">
                        <thead>
                            <tr className="border-b-2 border-stone-900">
                                <th className="py-4 pr-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Coupon Code</th>
                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Status</th>
                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Offer Value</th>
                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Eligibility</th>
                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Validity</th>
                                <th className="py-4 pl-4 font-bold tracking-widest uppercase text-[10px] text-stone-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-stone-600">
                            {coupons.map(coupon => {
                                const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                                return (
                                    <tr key={coupon.id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors group">
                                        {/* Premium Code Look */}
                                        <td className="py-5 pr-4">
                                            <span className="inline-flex items-center gap-2 px-3 py-1.5 border border-dashed border-stone-300 bg-stone-50 text-stone-900 font-mono font-bold text-xs rounded tracking-widest uppercase group-hover:border-stone-500 transition-colors">
                                                <FiTag className="text-stone-400" size={12} /> {coupon.code}
                                            </span>
                                        </td>

                                        {/* Status Badge */}
                                        <td className="py-5 px-4">
                                            {isExpired ? (
                                                <span className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full bg-red-50 text-red-600 border border-red-100">Expired</span>
                                            ) : (
                                                <span className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full bg-green-50 text-green-600 border border-green-100 flex items-center gap-1 w-max">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Active
                                                </span>
                                            )}
                                        </td>

                                        {/* Value */}
                                        <td className="py-5 px-4">
                                            <span className="font-bold text-stone-900 text-sm">
                                                {coupon.type === 'percent' ? `${coupon.discount}% OFF` : `${convertPrice(coupon.discount)} OFF`}
                                            </span>
                                        </td>

                                        {/* Target */}
                                        <td className="py-5 px-4">
                                            <span className="text-xs font-medium text-stone-600 capitalize">
                                                {coupon.target_role === 'customer' ? 'Members Only' :
                                                    coupon.target_role === 'student' ? 'Verified Students' : 'Everyone'}
                                            </span>
                                        </td>

                                        {/* Validity */}
                                        <td className="py-5 px-4">
                                            <span className={`text-xs font-medium flex items-center gap-1.5 ${isExpired ? 'text-stone-400' : 'text-stone-900'}`}>
                                                <FiClock size={12} className={isExpired ? 'text-stone-300' : 'text-blue-500'} />
                                                {safeDate(coupon.expires_at)}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-5 pl-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openCouponModal(coupon)} className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors">
                                                    <FiEdit2 size={12} />
                                                </button>
                                                <button onClick={() => deleteCoupon(coupon.id)} className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors">
                                                    <FiTrash2 size={12} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {coupons.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center py-16">
                                        <FiActivity className="mx-auto text-stone-200 mb-3" size={32} />
                                        <p className="text-stone-400 text-sm">No promo campaigns are currently running.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 🔥 PREMIUM MODAL */}
            {isCouponModalOpen && (
                <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in custom-scrollbar">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-stone-100">

                        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                            <h3 className="text-xl font-light text-stone-900">{selectedCoupon ? 'Edit' : 'Create'} <span className="font-serif italic font-bold">Campaign</span></h3>
                            <button onClick={() => setIsCouponModalOpen(false)} className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors shadow-sm">
                                <FiX size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleCouponSubmit} className="p-8 space-y-6">

                            <div>
                                <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Secret Code *</label>
                                <input
                                    required type="text"
                                    value={couponForm.code}
                                    onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                                    className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 font-mono font-bold uppercase text-lg text-stone-900 tracking-widest"
                                    placeholder="e.g. VIP50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Offer Type</label>
                                    <select
                                        value={couponForm.type}
                                        onChange={e => setCouponForm({ ...couponForm, type: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 appearance-none text-sm font-medium text-stone-900"
                                    >
                                        <option value="percent">Percentage Off (%)</option>
                                        <option value="fixed">Flat Amount Off</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Discount Value *</label>
                                    <input
                                        required type="number" step="0.01"
                                        value={couponForm.discount}
                                        onChange={e => setCouponForm({ ...couponForm, discount: Number(e.target.value) })}
                                        className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 font-bold text-sm text-stone-900"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Eligibility</label>
                                    <select
                                        value={couponForm.target_role}
                                        onChange={e => setCouponForm({ ...couponForm, target_role: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 appearance-none text-sm font-medium text-stone-900"
                                    >
                                        <option value="all">Everyone</option>
                                        <option value="customer">Members Only</option>
                                        {/* 🔥 यह लाइन वापस जोड़ दी गई है */}
                                        <option value="student">Verified Students</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Valid Until (Optional)</label>
                                    <input
                                        type="date"
                                        value={couponForm.expires_at}
                                        onChange={e => setCouponForm({ ...couponForm, expires_at: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 text-sm font-medium text-stone-900"
                                    />
                                </div>
                            </div>

                            {/* 🔥 RESTORED CANCEL BUTTON */}
                            <div className="pt-6 flex justify-end gap-3 border-t border-stone-100 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCouponModalOpen(false)}
                                    className="px-6 py-3.5 border border-stone-200 rounded-full text-stone-900 hover:bg-stone-50 text-[10px] font-bold tracking-widest uppercase transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3.5 bg-stone-900 text-white rounded-full hover:bg-stone-800 text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg shadow-stone-900/10 transition-colors"
                                >
                                    <FiCheck size={14} /> {selectedCoupon ? 'Save Changes' : 'Launch Campaign'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </>
    );
}