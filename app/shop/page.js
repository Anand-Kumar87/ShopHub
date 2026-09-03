import { supabase } from '../utils/supabase';
import ShopClient from './ShopClient';

export const revalidate = 60;

export default async function ShopPage() {
    try {
        const [categoriesRes, productsRes] = await Promise.all([
            supabase.from('categories').select('*'),
            supabase.from('products').select('*')
        ]);

        const categories = categoriesRes.data && categoriesRes.data.length > 0
            ? [{ name: 'All Products', slug: 'all' }, ...categoriesRes.data]
            : [{ name: 'All Products', slug: 'all' }];

        const activeProducts = (productsRes.data || []).filter(p => {
            const stat = (p.status || '').toLowerCase();
            return stat !== 'archived' && stat !== 'draft';
        });

        const products = activeProducts.map(p => {
            let safeImages = ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'];
            if (Array.isArray(p.images) && p.images.length > 0) safeImages = p.images;
            else if (typeof p.images === 'string' && p.images.trim() !== '') safeImages = [p.images];
            else if (p.image) safeImages = [p.image]; // 🔥 FIX: Added support for 'image' key
            else if (p.image_url) safeImages = [p.image_url];

            return {
                ...p,
                colors: Array.isArray(p.colors) && p.colors.length ? p.colors : ['#000000', '#D1D5DB'],
                sizes: Array.isArray(p.sizes) && p.sizes.length ? p.sizes : ['One Size'],
                tags: Array.isArray(p.tags) && p.tags.length ? p.tags : (p.onSale ? ['Sale'] : ['New']),
                rating: p.rating || 5.0,
                reviews: p.reviews || [],
                images: safeImages
            };
        });

        return <ShopClient initialCategories={categories} initialProducts={products} />;

    } catch (error) {
        console.error("SSR Fetch Error:", error);
        return <ShopClient initialCategories={[{ name: 'All Products', slug: 'all' }]} initialProducts={[]} />;
    }
}
