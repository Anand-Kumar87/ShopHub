import { supabase } from '../../utils/supabase';
import ProductDetailClient from './ProductDetailClient';

export default async function ProductDetailPage({ params }) {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    let initialProduct = null;
    let initialRelated = [];

    if (id) {
        try {
            const { data } = await supabase.from('products').select('*').eq('id', id).single();

            if (data) {
                initialProduct = {
                    ...data,
                    colors: data.colors || [],
                    sizes: data.sizes || [],
                    images: data.images?.length ? data.images : (data.image ? [data.image] : ['https://images.unsplash.com/photo-1434389670869-c87510fed58f?auto=format&fit=crop&w=800&q=80']),
                    reviews: data.reviews || [],
                    rating: data.rating || 5.0
                };

                let fetchedRelated = [];
                const { data: sameCatData } = await supabase
                    .from('products')
                    .select('*')
                    .ilike('category', initialProduct.category || '')
                    .neq('id', initialProduct.id)
                    .eq('status', 'active')
                    .limit(4);

                fetchedRelated = sameCatData || [];

                if (fetchedRelated.length < 4) {
                    const excludeIds = [initialProduct.id, ...fetchedRelated.map(p => p.id)];
                    let query = supabase.from('products').select('*').eq('status', 'active').limit(10);
                    excludeIds.forEach(exId => { query = query.neq('id', exId); });

                    const { data: anyCatData } = await query;

                    if (anyCatData) {
                        const existingIds = new Set(fetchedRelated.map(p => p.id));
                        const fillData = anyCatData.filter(p => !existingIds.has(p.id));
                        fetchedRelated = [...fetchedRelated, ...fillData].slice(0, 4);
                    }
                }

                initialRelated = fetchedRelated;
            }
        } catch (error) {
            console.error('SSR Product Fetch Error:', error);
        }
    }

    return <ProductDetailClient initialProduct={initialProduct} initialRelated={initialRelated} />;
}
