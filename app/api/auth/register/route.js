export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
    global: {
        fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(6000) })
    }
});

/**
 * POST /api/auth/register
 * Z+ Security Registration Handler:
 * - Strictly prevents duplicate account creation or account hijacking
 * - Blocks existing email re-registration
 * - Strictly enforces 'customer' role (prevents privilege escalation)
 * - Persists verified user profile to 'profiles' table
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { firstName, lastName, email, password } = body;

        // 1. Rigorous Field Validation
        if (!firstName || firstName.trim().length < 2) {
            return NextResponse.json({ error: 'First name must be at least 2 characters long' }, { status: 400 });
        }
        if (!lastName || lastName.trim().length < 2) {
            return NextResponse.json({ error: 'Last name must be at least 2 characters long' }, { status: 400 });
        }

        const normalizedEmail = (email || '').trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
            return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
        }

        // Password Security Requirements
        if (!password || password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
        }
        if (!/[A-Z]/.test(password)) {
            return NextResponse.json({ error: 'Password must contain at least one uppercase letter' }, { status: 400 });
        }
        if (!/[0-9]/.test(password)) {
            return NextResponse.json({ error: 'Password must contain at least one number' }, { status: 400 });
        }

        // 2. Pre-Check: Prevent Duplicate Registration in Database
        const { data: existingProfile } = await adminSupabase
            .from('profiles')
            .select('id, email')
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (existingProfile) {
            return NextResponse.json({
                error: 'An account with this email address already exists. Please sign in instead.'
            }, { status: 409 });
        }

        // 3. Create User in Supabase Auth
        const { data: authData, error: authError } = await adminSupabase.auth.signUp({
            email: normalizedEmail,
            password: password,
            options: {
                data: {
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    role: 'customer' // Enforce customer role
                }
            }
        });

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        // 4. Anti-Enumeration Defense Check:
        // When Supabase detects an already existing email, it returns an empty identities array
        if (authData.user && Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
            return NextResponse.json({
                error: 'An account with this email address already exists. Please sign in instead.'
            }, { status: 409 });
        }

        if (!authData.user?.id) {
            return NextResponse.json({ error: 'Failed to create user credentials' }, { status: 500 });
        }

        // 5. Insert Verified Profile in 'profiles' Table
        const { error: profileError } = await adminSupabase
            .from('profiles')
            .insert([
                {
                    id: authData.user.id,
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    email: normalizedEmail,
                    role: 'customer',
                    created_at: new Date().toISOString()
                }
            ]);

        if (profileError) {
            if (profileError.code === '23505') {
                return NextResponse.json({
                    error: 'An account with this email address already exists. Please sign in instead.'
                }, { status: 409 });
            }
            console.error('Profile creation error:', profileError);
        }

        return NextResponse.json({
            success: true,
            message: 'Account created successfully.',
            userId: authData.user.id
        }, { status: 201 });

    } catch (error) {
        console.error('Registration Exception:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}