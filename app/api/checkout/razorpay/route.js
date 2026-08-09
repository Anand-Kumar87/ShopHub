import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabase } from '../../../utils/supabase'; // <-- Relative path used here

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const body = await req.json();
        const { total_amount, currency, id } = body;

        const { data: settings, error } = await supabase
            .from('admin_settings')
            .select('razorpayKeyId, razorpayKeySecret')
            .single();

        if (error || !settings?.razorpayKeyId || !settings?.razorpayKeySecret) {
            return NextResponse.json(
                { error: "Razorpay API Keys not configured in Admin Panel." },
                { status: 400 }
            );
        }

        const razorpay = new Razorpay({
            key_id: settings.razorpayKeyId,
            key_secret: settings.razorpayKeySecret,
        });

        const options = {
            amount: Math.round(total_amount * 100),
            currency: (currency || 'INR').toUpperCase(),
            receipt: id,
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency
        });

    } catch (error) {
        console.error("Razorpay API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}