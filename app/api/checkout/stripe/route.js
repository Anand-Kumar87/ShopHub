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

        const lineItems = items.map(item => ({
            price_data: {
                currency: (currency || 'USD').toLowerCase(),
                product_data: {
                    name: item.name,
                    images: item.images || (item.image ? [item.image] : [])
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity || 1,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${req.headers.get('origin')}/checkout?success=true&order=${id}`,
            cancel_url: `${req.headers.get('origin')}/checkout?canceled=true`,
        });

        return NextResponse.json({ url: session.url });

    } catch (error) {
        console.error("Stripe API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}