export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // 🔥 Added Node.js runtime for Vercel consistency

import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase';

// GET: Jab frontend settings mange (Jaise Checkout page)

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('admin_settings')
            .select('*')
            .single();

        if (error) {
            // Agar table mein abhi tak koi row nahi hai, toh khali object bhej do
            if (error.code === 'PGRST116') {
                return NextResponse.json({}, { status: 200 });
            }
            throw error;
        }

        return NextResponse.json(data || {}, { status: 200 });
    } catch (error) {
        console.error("Settings GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Jab Admin panel se naye settings Save kiye jayein
export async function POST(req) {
    try {
        const body = await req.json();

        // Hum hamesha ID 1 wali row ko update (upsert) karenge taaki ek hi settings file rahe
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
