export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // 🔥 Added Node.js runtime for Vercel consistency

import { NextResponse } from 'next/server';

export async function GET() {
    const posts = [
        { id: 1, title: "Top 10 Fashion Trends for 2024", excerpt: "Discover what's hot this season...", date: "Oct 12, 2023", author: "ShopHub Editor" },
        { id: 2, title: "How to Choose the Perfect Gadget", excerpt: "A comprehensive guide to buying electronics...", date: "Oct 05, 2023", author: "Tech Team" }
    ];
    return NextResponse.json(posts, { status: 200 });
}
