import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    // Mock Wishlist Data from Database
    const wishlistItems = [
        {
            id: 1,
            name: 'Wireless Noise Cancelling Headphones',
            price: 199.99,
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80',
            inStock: true
        },
        {
            id: 2,
            name: 'Premium Leather Wallet',
            price: 49.99,
            image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=500&q=80',
            inStock: false
        }
    ];

    return NextResponse.json(wishlistItems, { status: 200 });
}

export async function DELETE(request) {
    // Logic to delete item from wishlist
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    return NextResponse.json({ message: `Item ${id} removed from wishlist` }, { status: 200 });
}