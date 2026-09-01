'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabase';
import { useGlobalCurrency } from '../../context/CurrencyContext';
import toast from 'react-hot-toast';
import {
    FiPlus, FiEdit2, FiTrash2, FiImage, FiX, FiCheck, FiUploadCloud
} from 'react-icons/fi';

export default function ProductManagement() {
    const { convertPrice } = useGlobalCurrency() || { convertPrice: (val) => `₹${val}` };

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const [productForm, setProductForm] = useState({
        name: '', sku: '', category: '', price: 0, salePrice: 0, onSale: false,
        stock: 0, status: 'active', images: [], description: '', colors: '', sizes: ''
    });

    const productFileInputRef = useRef(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                // Safe Fetch without sorting in database
                const { data: realProducts, error: prodError } = await supabase
                    .from('products')
                    .select('*');

                if (realProducts && !prodError) {
                    const sortedProducts = realProducts.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                    setProducts(sortedProducts.map(p => ({ ...p, images: p.images || (p.image_url ? [p.image_url] : []) })));
                }

                const { data: realCategories } = await supabase.from('categories').select('*');
                if (realCategories) setCategories(realCategories);

            } catch (error) {
                console.error("Data Fetch Error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'bg-stone-900 text-white';
            case 'draft': case 'archived': return 'bg-stone-200 text-stone-500';
            default: return 'bg-stone-100 text-stone-900';
        }
    };

    // 🔥 FLIPKART LEVEL OPTIMIZATION: Direct Supabase Bucket Upload
    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setIsUploading(true);
        const uploadedUrls = [];

        for (const file of files) {
            try {
                // 1. हर इमेज के लिए एक यूनिक (अनोखा) नाम बनाएं
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `products/${fileName}`;

                // 2. आपकी बनाई हुई 'images' बकेट में इमेज अपलोड करें
                const { error: uploadError } = await supabase.storage
                    .from('images') // 🔥 यह आपके स्क्रीनशॉट वाली बकेट का नाम है
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false // पुरानी फाइल पर ओवरराइट न करे
                    });

                if (uploadError) {
                    toast.error(`Upload Failed (${file.name}): ${uploadError.message}`);
                    continue; // अगर एक फेल हो जाए, तो अगले पर जाए
                }

                // 3. अपलोड होने के बाद उसका 'पब्लिक लिंक (URL)' निकालें
                const { data } = supabase.storage
                    .from('images')
                    .getPublicUrl(filePath);

                uploadedUrls.push(data.publicUrl); // यह लिंक सीधा डेटाबेस में सेव होगा

            } catch (error) {
                console.error("Upload Logic Error:", error);
            }
        }

        // 4. अगर लिंक मिल गए हैं, तो उन्हें फॉर्म में दिखा दें
        if (uploadedUrls.length > 0) {
            setProductForm(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
            toast.success("Images uploaded to Secure Vault!");
        }
        setIsUploading(false);
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const filesToUpload = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) filesToUpload.push(blob);
            }
        }

        if (filesToUpload.length > 0) {
            handleImageUpload({ target: { files: filesToUpload } });
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
                price: Number(product.price || 0),
                salePrice: Number(product.salePrice || 0),
                images: product.images || (product.image_url ? [product.image_url] : []),
                colors: product.colors ? product.colors.join(', ') : '',
                sizes: product.sizes ? product.sizes.join(', ') : '',
                onSale: product.onSale || false
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

        if (isUploading) return toast.error("Please wait for images to finish uploading.");

        const colorsArray = typeof productForm.colors === 'string'
            ? productForm.colors.split(',').map(c => c.trim()).filter(Boolean)
            : productForm.colors || [];

        const sizesArray = typeof productForm.sizes === 'string'
            ? productForm.sizes.split(',').map(s => s.trim()).filter(Boolean)
            : productForm.sizes || [];

        // EXACT SCHEMA MAPPING
        const finalProduct = {
            name: productForm.name,
            sku: productForm.sku,
            category: productForm.category,
            price: Number(productForm.price),
            "salePrice": Number(productForm.salePrice),
            "onSale": productForm.onSale,
            stock: Number(productForm.stock),
            status: productForm.status,
            images: productForm.images, // 🔥 अब इसमें Base64 नहीं, बल्कि सीधा URL जाएगा
            image_url: productForm.images[0] || null,
            description: productForm.description,
            colors: colorsArray,
            sizes: sizesArray,
            "oldPrice": productForm.onSale ? Number(productForm.price) : null,
            tags: productForm.onSale ? ['Sale'] : ['New']
        };

        if (selectedProduct) {
            const { error } = await supabase.from('products').update(finalProduct).eq('id', selectedProduct.id);
            if (error) return toast.error("Database Update Failed: " + error.message);

            setProducts(products.map(p => p.id === selectedProduct.id ? { ...p, ...finalProduct } : p));
            toast.success("Product updated successfully!");
        } else {
            const insertData = { ...finalProduct };

            const { data, error } = await supabase.from('products').insert([insertData]).select();
            if (error) return toast.error("Database Insert Failed: " + error.message);

            const newProdObj = data && data.length > 0 ? data[0] : insertData;
            setProducts([newProdObj, ...products]);
            toast.success("Product created in REAL Database!");
        }

        setIsProductModalOpen(false);
    };

    const deleteProduct = async (id) => {
        if (window.confirm("Remove this piece from the catalog?")) {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) return toast.error("DB Error: " + error.message);

            setProducts(products.filter(p => p.id !== id));
            toast.success("Product removed!");
        }
    };

    if (isLoading) {
        return <div className="text-stone-400 text-sm animate-pulse pt-10">Loading Catalog...</div>;
    }

    return (
        <>
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

                <div className="overflow-x-auto pb-10">
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

            {/* MODAL OUTSIDE DIV */}
            {isProductModalOpen && (
                <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-[100] flex items-start justify-center p-4 pt-16 overflow-y-auto pb-24 custom-scrollbar" onPaste={handlePaste}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] animate-fade-in">
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
                                        className={`border-2 border-dashed border-stone-200 rounded-2xl p-10 text-center bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer flex flex-col items-center justify-center mb-6 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                                        onClick={() => !isUploading && productFileInputRef.current.click()}
                                    >
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                            {isUploading ? (
                                                <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin"></div>
                                            ) : (
                                                <FiUploadCloud size={24} className="text-stone-400" />
                                            )}
                                        </div>
                                        <p className="text-sm font-bold text-stone-900 mb-1">{isUploading ? 'Uploading to Secure Vault...' : 'Click to Upload Securely'}</p>
                                        {!isUploading && <p className="text-xs text-stone-500 mb-3">Or <kbd className="bg-white border border-stone-200 px-2 py-0.5 rounded-md font-mono text-[10px]">Ctrl+V</kbd> anywhere to paste.</p>}

                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="hidden"
                                            ref={productFileInputRef}
                                            onChange={handleImageUpload}
                                        />
                                        {!isUploading && <span className="bg-stone-900 text-white text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-full">Select Files</span>}
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
                                        disabled={isUploading}
                                        className={`px-10 py-3.5 bg-stone-900 text-white rounded-full hover:bg-stone-800 text-xs font-bold tracking-widest uppercase shadow-xl shadow-stone-900/20 transition-colors flex items-center gap-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <FiCheck size={16} /> Save Product
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}