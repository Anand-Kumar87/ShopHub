export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase'; // पाथ अपने फोल्डर के हिसाब से चेक कर लें

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // 1. Basic Validation (Replaces Zod)
        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        // 2. Login & Verify Password via Supabase (Replaces Prisma & Bcrypt)
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.toLowerCase(),
            password: password
        });

        if (error) {
            // Supabase automatically handles incorrect passwords and unregistered emails
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        // 3. Return success with token (Replaces jsonwebtoken)
        return NextResponse.json({
            message: 'Login successful',
            token: data.session?.access_token, // Supabase's auto-generated secure JWT
            user: data.user
        }, { status: 200 });

    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}