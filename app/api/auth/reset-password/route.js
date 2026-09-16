export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
    global: {
        fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(8000) })
    }
});

/**
 * POST /api/auth/reset-password
 * Secure Server-Side Password Reset Verification:
 * 1. Validates new password complexity
 * 2. Verifies cryptographic recovery token_hash or email OTP
 * 3. Commits new password via Supabase Auth Admin API
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password, token_hash, otp } = body;

        // 1. Password Strength Validation
        if (!password || password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
        }
        if (!/[A-Z]/.test(password)) {
            return NextResponse.json({ error: 'Password must contain at least one uppercase letter.' }, { status: 400 });
        }
        if (!/[0-9]/.test(password)) {
            return NextResponse.json({ error: 'Password must contain at least one number.' }, { status: 400 });
        }

        let verifiedUserId = null;
        const normalizedEmail = (email || '').trim().toLowerCase();

        // 2. Verification Method A: token_hash (from email 1-click link)
        if (token_hash) {
            const { data: verifyData, error: verifyError } = await adminSupabase.auth.verifyOtp({
                token_hash: token_hash.trim(),
                type: 'recovery'
            });

            if (verifyError || !verifyData?.user?.id) {
                console.error('token_hash verification failed:', verifyError?.message);
                return NextResponse.json({
                    error: 'The password reset link has expired or is invalid. Please request a new link.'
                }, { status: 400 });
            }

            verifiedUserId = verifyData.user.id;
        }
        // 3. Verification Method B: email + OTP code
        else if (normalizedEmail && otp) {
            const { data: otpData, error: otpError } = await adminSupabase.auth.verifyOtp({
                email: normalizedEmail,
                token: otp.trim(),
                type: 'recovery'
            });

            if (otpError || !otpData?.user?.id) {
                console.error('OTP verification failed:', otpError?.message);
                return NextResponse.json({
                    error: 'The recovery code is incorrect or has expired. Please verify and try again.'
                }, { status: 400 });
            }

            verifiedUserId = otpData.user.id;
        } else {
            return NextResponse.json({
                error: 'Missing security credentials. Please use the link provided in your email.'
            }, { status: 400 });
        }

        // 4. Update User Password in Supabase Auth
        const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
            verifiedUserId,
            { password: password }
        );

        if (updateError) {
            console.error('Password update failed:', updateError.message);
            return NextResponse.json({
                error: 'Unable to update password. Please try again or request a new reset link.'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Your password has been successfully updated.'
        }, { status: 200 });

    } catch (error) {
        console.error('Reset Password API Exception:', error);
        return NextResponse.json({
            error: 'An unexpected error occurred while resetting your password.'
        }, { status: 500 });
    }
}
