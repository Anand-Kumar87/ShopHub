export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabase';
import { verifyServerAuth } from '../../utils/serverAuth';
import { catalogCache } from '../../utils/cacheUtils';

// Columns actually needed by the storefront/admin list — avoids pulling
// large fields (e.g. legacy base64 image strings, full reviews arrays)
// on every request.
const PRODUCT_COLUMNS =
    'id,name,description,price,salePrice,oldPrice,category,images,image_url,colors,sizes,tags,rating,stock,status,sku,created_at';

// Escapes characters that have special meaning inside a PostgREST
// `.or()` filter string (`,`, `(`, `)`), so user input can never
// alter the filter's structure. Backslash-escaping (not stripping)
// keeps legitimate search terms like "L'Oreal" or "Men's" intact.
function escapePostgrestFilterValue(value) {
    return value.replace(/[%,()\\]/g, (char) => `\\${char}`);
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const category = searchParams.get('category');
        const sort = searchParams.get('sort');

        // Clamp page/limit to sane bounds
        const page = Math.max(parseInt(searchParams.get('page')) || 1, 1);
        const limit = Math.min(Math.max(parseInt(searchParams.get('limit')) || 10, 1), 50);

        // Check High-Throughput Memory Cache first
        const cacheKey = `products_${category || 'all'}_${search || ''}_${sort || 'new'}_${page}_${limit}`;
        const cachedPayload = catalogCache.get(cacheKey);
        if (cachedPayload) {
            return NextResponse.json(cachedPayload, {
                status: 200,
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
                    'X-Cache-Status': 'HIT'
                }
            });
        }

        const skip = (page - 1) * limit;
        const to = skip + limit - 1;

        // 1. Build query safely, selecting only the columns we need
        let query = supabase.from('products').select(PRODUCT_COLUMNS, { count: 'exact' });

        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        if (search) {
            const safeSearch = escapePostgrestFilterValue(search);
            query = query.or(
                `name.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%,sku.ilike.%${safeSearch}%`
            );
        }

        // 2. Apply sorting
        if (sort === 'price-low') {
            query = query.order('price', { ascending: true });
        } else if (sort === 'price-high') {
            query = query.order('price', { ascending: false });
        } else if (sort === 'name-asc') {
            query = query.order('name', { ascending: true });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        // 3. Apply pagination
        query = query.range(skip, to);

        const { data: products, count: totalProducts, error } = await query;

        if (error) {
            console.error('Supabase Query Error:', error);
            throw error;
        }

        const responseData = {
            products: products || [],
            totalPages: Math.ceil((totalProducts || 0) / limit) || 1,
            currentPage: page,
            totalProducts: totalProducts || 0
        };

        // Cache for 30 seconds in memory (handles 2-5 lakh traffic spikes effortlessly)
        catalogCache.set(cacheKey, responseData, 30);

        return NextResponse.json(responseData, {
            status: 200,
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
                'X-Cache-Status': 'MISS'
            }
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({
            products: [],
            totalPages: 1,
            currentPage: 1,
            totalProducts: 0,
            error: 'Failed to load products'
        }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        // Enforce centralized API gateway token & role check
        const auth = await verifyServerAuth(request, { requireAdmin: true });
        if (!auth.authorized) {
            return NextResponse.json(
                { error: auth.error || 'Forbidden: Administrator privileges required' },
                { status: auth.status || 403 }
            );
        }

        const body = await request.json();

        // 3. Whitelist fields — never insert the raw request body directly.
        // This blocks mass-assignment (e.g. a caller setting id, rating,
        // reviews, or created_at themselves).
        const {
            name,
            description,
            price,
            salePrice,
            oldPrice,
            category,
            images,
            colors,
            sizes,
            tags,
            sku,
            stock,
            status
        } = body;

        // 4. Basic validation
        if (!name || typeof name !== 'string' || !name.trim()) {
            return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
        }
        const parsedPrice = Number(price);
        if (!price || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
            return NextResponse.json({ error: 'A valid price is required' }, { status: 400 });
        }

        const { data: product, error } = await supabase
            .from('products')
            .insert([{
                name: name.trim(),
                description: description || '',
                price: parsedPrice,
                salePrice: salePrice ? Number(salePrice) : null,
                oldPrice: oldPrice ? Number(oldPrice) : null,
                category: category || null,
                images: Array.isArray(images) ? images : [],
                colors: Array.isArray(colors) ? colors : [],
                sizes: Array.isArray(sizes) ? sizes : [],
                tags: Array.isArray(tags) ? tags : [],
                sku: sku || null,
                stock: stock ? Number(stock) : 0,
                status: status === 'draft' || status === 'archived' ? status : 'active'
            }])
            .select()
            .single();

        if (error) throw error;

        // Invalidate in-memory catalog cache so the new product is visible immediately
        catalogCache.clear();

        return NextResponse.json({ message: 'Product created', product }, { status: 201 });
    } catch (error) {
        console.error('Create Product Error:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}