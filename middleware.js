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
    const isProtectedRoute = path.startsWith('/account') || path.startsWith('/checkout');

    // अगर राउट प्रोटेक्टेड है और यूजर की कुकी नहीं है, तो लॉगिन पर भेजें
    if (isProtectedRoute && !user) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return supabaseResponse;
}

export const config = {
    matcher: ['/account/:path*', '/admin/:path*', '/checkout/:path*'],
};
