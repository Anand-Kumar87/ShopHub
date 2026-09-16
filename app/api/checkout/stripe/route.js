export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // 🔥 Added Node.js runtime for Vercel consistency

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '../../../utils/supabase'; // <-- Relative path used here


export async function POST(req) {
    try {
        const body = await req.json();
        const { items, total_amount, currency, id } = body;

        const { data: settings, error } = await supabase
            .from('admin_settings')
            .select('stripeSecretKey')
            .single();

        if (error || !settings?.stripeSecretKey) {
            return NextResponse.json(
                { error: "Stripe API Key is not configured in Admin Panel." },
                { status: 400 }
            );
        }

        const stripe = new Stripe(settings.stripeSecretKey, {
            apiVersion: '2023-10-16'
        });

        const lineItems = items.map(item => {
            const rawImages = item.images || (item.image ? [item.image] : []);
            const validImages = Array.isArray(rawImages)
                ? rawImages.filter(img => typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://')))
                : [];

            return {
                price_data: {
                    currency: (currency || 'USD').toLowerCase(),
                    product_data: {
                        name: item.name,
                        ...(validImages.length > 0 ? { images: validImages.slice(0, 8) } : {})
                    },
                    unit_amount: Math.round(item.price * 100),
                },
                quantity: item.quantity || 1,
            };
        });

        const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://shophubstyle.vercel.app';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            metadata: {
                orderId: id || ''
            },
            success_url: `${origin}/checkout?success=true&session_id={CHECKOUT_SESSION_ID}&order=${id}`,
            cancel_url: `${origin}/checkout?canceled=true`,
        });

        return NextResponse.json({ url: session.url, sessionId: session.id });

    } catch (error) {
        console.error("Stripe API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
