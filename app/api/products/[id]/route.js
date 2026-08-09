export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // 🔥 Added Node.js runtime to fix Vercel build

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// GET: Fetch a single product by ID
export async function GET(request, { params }) {
    const prisma = new PrismaClient(); // 🔥 Moved inside function
    try {
        const id = parseInt(params.id);

        if (isNaN(id)) {
            await prisma.$disconnect();
            return NextResponse.json({ message: 'Invalid Product ID' }, { status: 400 });
        }

        const product = await prisma.product.findUnique({
            where: { id: id }
        });

        if (!product) {
            await prisma.$disconnect();
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }

        await prisma.$disconnect();
        return NextResponse.json(product, { status: 200 });
    } catch (error) {
        console.error('Error fetching product:', error);
        await prisma.$disconnect();
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT: Update a product (Admin Action)
export async function PUT(request, { params }) {
    const prisma = new PrismaClient(); // 🔥 Moved inside function
    try {
        const id = parseInt(params.id);
        const body = await request.json();

        if (isNaN(id)) {
            await prisma.$disconnect();
            return NextResponse.json({ message: 'Invalid Product ID' }, { status: 400 });
        }

        const updatedProduct = await prisma.product.update({
            where: { id: id },
            data: {
                name: body.name,
                sku: body.sku,
                category: body.category,
                price: parseFloat(body.price),
                stock: parseInt(body.stock),
                status: body.status,
                image: body.image,
                description: body.description,
            }
        });

        await prisma.$disconnect();
        return NextResponse.json({ message: 'Product updated successfully', product: updatedProduct }, { status: 200 });
    } catch (error) {
        console.error('Error updating product:', error);
        await prisma.$disconnect();
        return NextResponse.json({ message: 'Failed to update product' }, { status: 500 });
    }
}

// DELETE: Remove a product (Admin Action)
export async function DELETE(request, { params }) {
    const prisma = new PrismaClient(); // 🔥 Moved inside function
    try {
        const id = parseInt(params.id);

        if (isNaN(id)) {
            await prisma.$disconnect();
            return NextResponse.json({ message: 'Invalid Product ID' }, { status: 400 });
        }

        await prisma.product.delete({
            where: { id: id }
        });

        await prisma.$disconnect();
        return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting product:', error);
        await prisma.$disconnect();
        return NextResponse.json({ message: 'Failed to delete product' }, { status: 500 });
    }
}
