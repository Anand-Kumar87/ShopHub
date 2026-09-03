import { supabase } from './utils/supabase';
import HomeClient from './HomeClient';

export const revalidate = 60;

export default async function HomePage() {
  try {
    // 🔥 BULLETPROOF FETCH: Removed .order() to bypass Usage Limit restrictions
    const [catsRes, prodsRes] = await Promise.all([
      supabase.from('categories').select('*').limit(10),
      supabase.from('products').select('*').limit(50)
    ]);

    const categories = catsRes.data || [];

    const activeProducts = (prodsRes.data || []).filter(p => {
      const stat = (p.status || '').toLowerCase();
      return stat !== 'archived' && stat !== 'draft';
    });

    const products = activeProducts.map(p => {
      let safeImages = ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'];
      if (Array.isArray(p.images) && p.images.length > 0) safeImages = p.images;
      else if (typeof p.images === 'string' && p.images.trim() !== '') safeImages = [p.images];
      else if (p.image) safeImages = [p.image];
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

    return <HomeClient initialCategories={categories} initialProducts={products} />;
  } catch (error) {
    console.error("Home SSR Error:", error);
    return <HomeClient initialCategories={[]} initialProducts={[]} />;
  }
}
