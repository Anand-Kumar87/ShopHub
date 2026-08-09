import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request) {
    try {
        // 1. Parse URL Parameters
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const category = searchParams.get('category');
        const sort = searchParams.get('sort');
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;

        const skip = (page - 1) * limit;

        // 2. Build Prisma Where Clause
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { description: { contains: search } },
                { sku: { contains: search } }
            ];
        }
        if (category && category !== 'all') {
            where.category = category;
        }

        // 3. Build Prisma OrderBy Clause
        let orderBy = { createdAt: 'desc' }; // default: newest
        if (sort === 'price-low') orderBy = { price: 'asc' };
        if (sort === 'price-high') orderBy = { price: 'desc' };
        if (sort === 'name-asc') orderBy = { name: 'asc' };

        // 4. Execute Query concurrently for performance
        const [products, totalProducts] = await Promise.all([
            prisma.product.findMany({ where, orderBy, skip, take: limit }),
            prisma.product.count({ where })
        ]);

        return NextResponse.json({
            products,
            totalPages: Math.ceil(totalProducts / limit),
            currentPage: page,
            totalProducts
        });

    } catch (error) {
        console.error('Products Error:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

export async function POST(request) {
    // Yahan aap Token verify karke Product create karne ka logic likh sakte hain
    try {
        const body = await request.json();
        const product = await prisma.product.create({ data: body });
        return NextResponse.json({ message: 'Product created', product }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}