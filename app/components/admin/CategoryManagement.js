'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabase';
import toast from 'react-hot-toast';
import {
    FiPlus, FiEdit2, FiTrash2, FiImage, FiX, FiCheck, FiUploadCloud, FiLayers, FiTag
} from 'react-icons/fi';

export default function CategoryManagement() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedCategoryProducts, setSelectedCategoryProducts] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', description: '', image: '' });
    const categoryFileInputRef = useRef(null);

    // 🚀 SAFE FETCH
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const { data: realCategories } = await supabase.from('categories').select('*');
                if (realCategories) setCategories(realCategories);

                const { data: realProducts } = await supabase.from('products').select('*');
                if (realProducts) setProducts(realProducts);

            } catch (error) {
                console.error("Data Fetch Error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // 🚀 BULLETPROOF MATCHER (Case-Insensitive)
    const getLinkedProducts = (categorySlug, categoryName) => {
        return products.filter(p => {
            const pCat = (p.category || '').toLowerCase().trim();
            const slugMatch = (categorySlug || '').toLowerCase().trim();
            const nameMatch = (categoryName || '').toLowerCase().trim();
            return pCat === slugMatch || pCat === nameMatch;
        });
    };

    // 🔥 FLIPKART LEVEL OPTIMIZATION: Direct Supabase Bucket Upload
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // 1. यूनिक फाइल का नाम बनाएं
            const fileExt = file.name.split('.').pop();
            const fileName = `cat-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `categories/${fileName}`; // यह 'images' बकेट के अंदर 'categories' फोल्डर में जाएगा

            // 2. डायरेक्ट बकेट में सुरक्षित अपलोड करें
            const { error: uploadError } = await supabase.storage
                .from('images') // आपकी बनाई हुई बकेट का नाम
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                toast.error(`Upload failed: ${uploadError.message}`);
                setIsUploading(false);
                return;
            }

            // 3. अपलोड होने के बाद Public URL निकालें
            const { data } = supabase.storage.from('images').getPublicUrl(filePath);
            setCategoryForm(prev => ({ ...prev, image: data.publicUrl }));
            toast.success("Cover Image uploaded securely!");

        } catch (error) {
            console.error("Upload Error:", error);
            toast.error("Network error during upload.");
        }
        setIsUploading(false);
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    handleImageUpload({ target: { files: [blob] } });
                }
            }
        }
    };

    const openCategoryModal = (category = null) => {
        if (category) {
            setSelectedCategory(category);
            setCategoryForm({ ...category, image: category.image || '' });

            const linked = getLinkedProducts(category.slug, category.name);
            setSelectedCategoryProducts(linked.map(p => p.id));
        } else {
            setSelectedCategory(null);
            setCategoryForm({ name: '', slug: '', description: '', image: '' });
            setSelectedCategoryProducts([]);
        }
        setIsCategoryModalOpen(true);
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        if (isUploading) return toast.error("Please wait for image to finish uploading.");

        const finalSlug = categoryForm.slug.toLowerCase().replace(/\s+/g, '-');
        const finalCategoryForm = { ...categoryForm, slug: finalSlug };

        if (selectedCategory) {
            const { error } = await supabase.from('categories').update(finalCategoryForm).eq('id', selectedCategory.id);
            if (error) return toast.error("Database Update Failed: " + error.message);

            setCategories(categories.map(c => c.id === selectedCategory.id ? { ...c, ...finalCategoryForm } : c));
            toast.success("Collection updated successfully!");
        } else {
            const insertData = { ...finalCategoryForm };
            delete insertData.id;
            delete insertData.created_at;

            const { data, error } = await supabase.from('categories').insert([insertData]).select();
            if (error) return toast.error("Database Insert Failed: " + error.message);

            const newCatObj = data && data.length > 0 ? data[0] : insertData;
            setCategories([newCatObj, ...categories]);
            toast.success("Premium Collection created!");
        }

        const updatedProducts = [...products];
        for (const p of updatedProducts) {
            const isSelected = selectedCategoryProducts.includes(p.id);
            const pCat = (p.category || '').toLowerCase().trim();
            const targetCat = finalSlug.toLowerCase().trim();

            if (isSelected && pCat !== targetCat) {
                p.category = finalSlug;
                await supabase.from('products').update({ category: finalSlug }).eq('id', p.id);
            } else if (!isSelected && pCat === targetCat) {
                p.category = '';
                await supabase.from('products').update({ category: '' }).eq('id', p.id);
            }
        }
        setProducts(updatedProducts);

        setIsCategoryModalOpen(false);
    };

    const deleteCategory = async (id, slug) => {
        if (window.confirm("Delete this collection? Linked products will become uncategorized.")) {
            const linked = getLinkedProducts(slug, '');
            for (const p of linked) {
                await supabase.from('products').update({ category: '' }).eq('id', p.id);
            }

            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (error) return toast.error("DB Error: " + error.message);

            setCategories(categories.filter(c => c.id !== id));
            setProducts(products.map(p => {
                const pCat = (p.category || '').toLowerCase().trim();
                return pCat === slug.toLowerCase().trim() ? { ...p, category: '' } : p;
            }));
            toast.success("Collection removed!");
        }
    };

    if (isLoading) {
        return <div className="text-stone-400 text-sm animate-pulse pt-10">Loading Collections...</div>;
    }

    return (
        <>
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

                <div className="overflow-x-auto pb-10">
                    <table className="min-w-full text-left text-sm">
                        <thead>
                            <tr className="border-b-2 border-stone-900">
                                <th className="py-4 pr-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Collection</th>
                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">URL Slug</th>
                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400 text-center">Items Included</th>
                                <th className="py-4 pl-4 font-bold tracking-widest uppercase text-[10px] text-stone-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-stone-600">
                            {categories.map(category => {
                                const itemCount = getLinkedProducts(category.slug, category.name).length;
                                return (
                                    <tr key={category.id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors group">
                                        <td className="py-5 pr-4 flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shadow-sm group-hover:border-stone-400 transition-colors">
                                                {category.image && category.image !== 'EMPTY' ? (
                                                    <img src={category.image} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <FiImage className="w-full h-full p-4 text-stone-300" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-stone-900 text-base">{category.name}</p>
                                                <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1 max-w-[250px]">{category.description || 'No description provided'}</p>
                                            </div>
                                        </td>
                                        <td className="py-5 px-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 text-stone-600 font-mono text-[10px] rounded font-bold uppercase tracking-widest">
                                                <FiTag size={10} className="text-stone-400" /> {category.slug}
                                            </span>
                                        </td>
                                        <td className="py-5 px-4 text-center">
                                            <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${itemCount > 0 ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400'}`}>
                                                {itemCount} Pieces
                                            </span>
                                        </td>
                                        <td className="py-5 pl-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openCategoryModal(category)}
                                                    className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                                                >
                                                    <FiEdit2 size={12} />
                                                </button>
                                                <button
                                                    onClick={() => deleteCategory(category.id, category.slug)}
                                                    className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                                                >
                                                    <FiTrash2 size={12} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {categories.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center py-16">
                                        <FiLayers className="mx-auto text-stone-200 mb-3" size={32} />
                                        <p className="text-stone-400 text-sm font-medium">No collections created yet.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 🚀 PREMIUM MODAL WITH STICKY BUTTON */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">

                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-stone-100 flex flex-col max-h-[90vh]">

                        {/* Static Header */}
                        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50 flex-shrink-0">
                            <h3 className="text-xl font-light text-stone-900">{selectedCategory ? 'Edit' : 'New'} <span className="font-serif italic font-bold">Collection</span></h3>
                            <button
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors shadow-sm"
                            >
                                <FiX size={16} />
                            </button>
                        </div>

                        {/* Scrollable Form Body */}
                        <div className="overflow-y-auto custom-scrollbar flex-1 p-8" onPaste={handlePaste}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Collection Name *</label>
                                        <input
                                            required type="text" value={categoryForm.name || ''}
                                            onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm font-bold text-stone-900"
                                            placeholder="e.g. Premium Winter Wear"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">URL Slug *</label>
                                        <input
                                            required type="text" value={categoryForm.slug || ''}
                                            onChange={e => setCategoryForm({ ...categoryForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                            className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm font-mono text-stone-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Description</label>
                                        <textarea
                                            rows="4" value={categoryForm.description || ''}
                                            onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-stone-50 border border-transparent rounded-lg focus:outline-none focus:border-stone-900 transition-colors text-sm resize-none text-stone-600"
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Cover Image</label>
                                        {categoryForm.image && categoryForm.image !== 'EMPTY' ? (
                                            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-stone-200 group shadow-sm">
                                                <img src={categoryForm.image} className="w-full h-full object-cover" alt="" />
                                                <button
                                                    type="button"
                                                    onClick={() => setCategoryForm({ ...categoryForm, image: '' })}
                                                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shadow-md"
                                                >
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                                className={`border-2 border-dashed border-stone-200 rounded-2xl aspect-[4/3] bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer flex flex-col items-center justify-center text-center p-6 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                                                onClick={() => !isUploading && categoryFileInputRef.current.click()}
                                            >
                                                {isUploading ? (
                                                    <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin mb-4"></div>
                                                ) : (
                                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                                        <FiUploadCloud size={20} className="text-stone-400" />
                                                    </div>
                                                )}
                                                <p className="text-xs font-bold text-stone-900 mb-1">{isUploading ? 'Uploading securely...' : 'Click to Upload'}</p>
                                                <p className="text-[10px] text-stone-400">Or Paste (Ctrl+V) anywhere</p>
                                                <input type="file" accept="image/*" className="hidden" ref={categoryFileInputRef} onChange={handleImageUpload} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Link Products Section */}
                                <div className="md:col-span-2 pt-4 border-t border-stone-100">
                                    <div className="flex justify-between items-end mb-3">
                                        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400">Add Products to Collection</label>
                                        <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 bg-stone-100 text-stone-600 rounded-full">
                                            {selectedCategoryProducts.length} Selected
                                        </span>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar border border-stone-200 rounded-2xl p-3 bg-stone-50/50 space-y-1">
                                        {products.map(p => (
                                            <label key={p.id} className="flex items-center gap-4 p-2 hover:bg-white rounded-xl cursor-pointer transition-all border border-transparent hover:border-stone-200 hover:shadow-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCategoryProducts.includes(p.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedCategoryProducts([...selectedCategoryProducts, p.id]);
                                                        else setSelectedCategoryProducts(selectedCategoryProducts.filter(id => id !== p.id));
                                                    }}
                                                    className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
                                                />
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-12 bg-white border border-stone-100 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                                                        <img src={p.image_url || p.images?.[0]} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-bold text-stone-900 block">{p.name}</span>
                                                        <span className="text-[10px] font-mono text-stone-400">{p.sku || 'NO SKU'}</span>
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                        {products.length === 0 && <p className="text-xs text-stone-400 p-2 text-center py-6">No products available in catalog yet.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 🚀 STICKY FOOTER BUTTONS */}
                        <div className="px-8 py-5 border-t border-stone-100 bg-white/95 backdrop-blur-md flex justify-end gap-3 flex-shrink-0 z-10">
                            <button
                                type="button"
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="px-6 py-3.5 border border-stone-200 rounded-full text-stone-900 hover:bg-stone-50 text-[10px] font-bold tracking-widest uppercase transition-colors"
                            >
                                Discard
                            </button>
                            <button
                                type="button"
                                onClick={handleCategorySubmit}
                                disabled={isUploading}
                                className={`px-8 py-3.5 bg-stone-900 text-white rounded-full hover:bg-stone-800 text-[10px] font-bold tracking-widest uppercase shadow-xl shadow-stone-900/20 transition-colors flex items-center gap-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <FiCheck size={14} /> {selectedCategory ? 'Update Collection' : 'Save Collection'}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
}
