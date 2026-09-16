import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // 🔥 Secure Token Validation
    const { data: { user } } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    // 🔥 If request has an OAuth code, route to /auth/callback to exchange for session cookies
    if (code) {
        return NextResponse.redirect(
            new URL(`/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(path)}`, request.url)
        );
    }

    // Redirect or block unauthenticated users
    if (!user) {
        if (path.startsWith('/api/admin')) {
            return NextResponse.json(
                { error: 'Unauthorized: Valid administrative session required' },
                { status: 401 }
            );
        }
        if (path.startsWith('/admin')) {
            return NextResponse.redirect(new URL('/login?redirect=/admin', request.url));
        }
        if (path.startsWith('/checkout')) {
            return NextResponse.redirect(new URL('/checkout-login?redirect=/checkout', request.url));
        }
        if (path.startsWith('/account')) {
            return NextResponse.redirect(new URL('/login?redirect=/account', request.url));
        }
    }

    // Role-based database authorization for admin paths
    if (user && (path.startsWith('/admin') || path.startsWith('/api/admin'))) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const role = (profile?.role || '').toLowerCase().trim();
        if (role !== 'admin') {
            if (path.startsWith('/api/')) {
                return NextResponse.json(
                    { error: 'Forbidden: Insufficient administrative privileges' },
                    { status: 403 }
                );
            }
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: ['/account/:path*', '/admin/:path*', '/checkout/:path*', '/api/admin/:path*'],
};