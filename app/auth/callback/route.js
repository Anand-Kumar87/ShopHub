import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

/**
 * GET /auth/callback
 * Next.js App Router OAuth PKCE Exchange Handler:
 * 1. Receives authorization code from Supabase OAuth
 * 2. Exchanges code for cryptographic session tokens
 * 3. Sets session cookies on the redirect response
 * 4. Ensures a profile exists in the database for first-time social users
 * 5. Redirects to target destination (default: /account)
 */
export async function GET(request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const nextParam = requestUrl.searchParams.get('next') || '/account';

    // Sanitize destination to prevent open redirect vulnerabilities
    const next = (nextParam.startsWith('/') && !nextParam.startsWith('//')) ? nextParam : '/account';

    if (code) {
        const redirectResponse = NextResponse.redirect(new URL(next, requestUrl.origin));

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            redirectResponse.cookies.set(name, value, options);
                        });
                    },
                },
            }
        );

        try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);

            if (!error && data?.user) {
                // Ensure profile exists in 'profiles' table
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, role')
                    .eq('id', data.user.id)
                    .maybeSingle();

                if (!profile) {
                    const fullName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || '';
                    const nameParts = fullName.trim().split(/\s+/);
                    const firstName = nameParts[0] || data.user.email?.split('@')[0] || 'User';
                    const lastName = nameParts.slice(1).join(' ') || '';
                    const avatarUrl = data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || '';

                    await supabase
                        .from('profiles')
                        .insert([
                            {
                                id: data.user.id,
                                email: data.user.email,
                                first_name: firstName,
                                last_name: lastName,
                                role: 'customer',
                                avatar_url: avatarUrl,
                                created_at: new Date().toISOString()
                            }
                        ]);
                }

                // If user is admin, redirect to /admin if destination was default
                if (profile?.role === 'admin' && next === '/account') {
                    return NextResponse.redirect(new URL('/admin', requestUrl.origin));
                }

                return redirectResponse;
            }

            console.error('OAuth code exchange failed:', error?.message);
        } catch (exchangeErr) {
            console.error('Exception during OAuth code exchange:', exchangeErr);
        }
    }

    // Fallback on error: redirect to login with error explanation
    return NextResponse.redirect(new URL('/login?error=oauth_exchange_failed', requestUrl.origin));
}
