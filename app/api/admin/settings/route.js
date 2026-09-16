export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase';
import { verifyServerAuth } from '../../../utils/serverAuth';

export async function GET(req) {
    try {
        const { data, error } = await supabase
            .from('admin_settings')
            .select('*')
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({}, { status: 200 });
            }
            throw error;
        }

        const settings = data || {};

        // Verify if caller has admin permissions
        const auth = await verifyServerAuth(req, { requireAdmin: true });
        if (auth.authorized) {
            return NextResponse.json(settings, { status: 200 });
        }

        // For non-admin visitors (storefront checkout & currency context), sanitize private secrets
        const publicSettings = { ...settings };
        delete publicSettings.stripeSecretKey;
        delete publicSettings.razorpayKeySecret;
        delete publicSettings.shiprocketPassword;

        return NextResponse.json(publicSettings, {
            status: 200,
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
            }
        });
    } catch (error) {
        console.error("Settings GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        // Enforce cryptographic token + database role check
        const auth = await verifyServerAuth(req, { requireAdmin: true });
        if (!auth.authorized) {
            return NextResponse.json(
                { error: auth.error || 'Unauthorized: Admin privileges required' },
                { status: auth.status || 401 }
            );
        }

        const body = await req.json();

        const { data, error } = await supabase
            .from('admin_settings')
            .upsert({ id: 1, ...body })
            .select();

        if (error) throw error;

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
        console.error("Settings POST Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}