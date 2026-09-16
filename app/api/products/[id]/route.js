export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase';
import { verifyServerAuth } from '../../../utils/serverAuth';
import { catalogCache } from '../../../utils/cacheUtils';

// GET: Fetch a single product by ID (Cached for 200k-500k DAU)
export async function GET(request, { params }) {
    try {
        const resolvedParams = await params;
        const id = (resolvedParams?.id || '').toString().trim();

        if (!id) {
            return NextResponse.json({ message: 'Invalid Product ID' }, { status: 400 });
        }

        // 1. Check in-memory bounded cache
        const cacheKey = `product_${id}`;
        const cachedProduct = catalogCache.get(cacheKey);
        if (cachedProduct) {
            return NextResponse.json(cachedProduct, {
                status: 200,
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
                    'X-Cache-Status': 'HIT'
                }
            });
        }

        // 2. Supabase Fetch
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !product) {
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }

        // Cache for 60s
        catalogCache.set(cacheKey, product, 60);

        return NextResponse.json(product, {
            status: 200,
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
                'X-Cache-Status': 'MISS'
            }
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT: Update a product (Admin Action)
export async function PUT(request, { params }) {
    try {
        const auth = await verifyServerAuth(request, { requireAdmin: true });
        if (!auth.authorized) {
            return NextResponse.json({ message: auth.error || 'Unauthorized: Admin privileges required' }, { status: auth.status || 401 });
        }

        const resolvedParams = await params;
        const id = (resolvedParams?.id || '').toString().trim();
        const body = await request.json();

        if (!id) {
            return NextResponse.json({ message: 'Invalid Product ID' }, { status: 400 });
        }

        // 🔥 Supabase Update
        const { data: updatedProduct, error } = await supabase
            .from('products')
            .update({
                name: body.name,
                sku: body.sku,
                category: body.category,
                price: parseFloat(body.price),
                stock: parseInt(body.stock),
                status: body.status,
                image: body.image,
                description: body.description,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase Update Error:', error);
            throw new Error('Failed to update product in database');
        }

        // Invalidate cache
        catalogCache.delete(`product_${id}`);
        catalogCache.delete('products_all_v2');

        return NextResponse.json({ message: 'Product updated successfully', product: updatedProduct }, { status: 200 });
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ message: 'Failed to update product' }, { status: 500 });
    }
}

// DELETE: Remove a product (Admin Action)
export async function DELETE(request, { params }) {
    try {
        const auth = await verifyServerAuth(request, { requireAdmin: true });
        if (!auth.authorized) {
            return NextResponse.json({ message: auth.error || 'Unauthorized: Admin privileges required' }, { status: auth.status || 401 });
        }

        const resolvedParams = await params;
        const id = (resolvedParams?.id || '').toString().trim();

        if (!id) {
            return NextResponse.json({ message: 'Invalid Product ID' }, { status: 400 });
        }

        // 🔥 Supabase Delete
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase Delete Error:', error);
            throw new Error('Failed to delete product from database');
        }

        // Invalidate cache
        catalogCache.delete(`product_${id}`);
        catalogCache.delete('products_all_v2');

        return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ message: 'Failed to delete product' }, { status: 500 });
    }
}