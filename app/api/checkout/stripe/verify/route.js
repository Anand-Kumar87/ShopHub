export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '../../../../utils/supabase';

/**
 * POST /api/checkout/stripe/verify
 * Server-Side Stripe Session Verification:
 * Validates that the Stripe Checkout session was genuinely paid.
 * Prevents spoofed redirects with fake `?success=true`.
 */
export async function POST(req) {
    try {
        const body = await req.json();
        const { session_id } = body;

        if (!session_id || typeof session_id !== 'string') {
            return NextResponse.json(
                { verified: false, error: 'Session ID is required for verification.' },
                { status: 400 }
            );
        }

        // Fetch Stripe secret key securely from database
        const { data: settings, error: settingsError } = await supabase
            .from('admin_settings')
            .select('stripeSecretKey')
            .single();

        if (settingsError || !settings?.stripeSecretKey) {
            return NextResponse.json(
                { verified: false, error: 'Stripe secret key not configured in store settings.' },
                { status: 500 }
            );
        }

        const stripe = new Stripe(settings.stripeSecretKey, {
            apiVersion: '2023-10-16'
        });

        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (!session) {
            return NextResponse.json(
                { verified: false, error: 'Stripe session could not be found.' },
                { status: 404 }
            );
        }

        const isPaid = session.payment_status === 'paid';

        if (!isPaid) {
            return NextResponse.json(
                { verified: false, error: `Payment incomplete. Current status: ${session.payment_status}` },
                { status: 400 }
            );
        }

        return NextResponse.json({
            verified: true,
            paymentStatus: 'Paid',
            sessionId: session.id,
            amountTotal: session.amount_total,
            currency: session.currency,
            customerEmail: session.customer_details?.email,
            customerName: session.customer_details?.name
        }, { status: 200 });

    } catch (error) {
        console.error('Stripe Verification Error:', error);
        return NextResponse.json(
            { verified: false, error: error.message || 'Internal Stripe verification error' },
            { status: 500 }
        );
    }
}
