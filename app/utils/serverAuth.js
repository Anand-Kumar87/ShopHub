// app/utils/serverAuth.js
//
// Centralized API Gateway authentication & database-level role verification.
// Validates sessions via cryptographic token check and database role lookup.
// Supports both browser session cookies and Bearer tokens for mobile/API clients.

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { authVerificationCache } from './cacheUtils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// Standalone service client for high-assurance role lookups (bypass RLS caching if service key present)
const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
    global: {
        fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(5000) })
    }
});

/**
 * Verify authentication and database role at the server / API gateway level.
 * @param {Request} request - Next.js Request object
 * @param {Object} options - { requireAdmin: boolean }
 * @returns {Promise<{ authorized: boolean, user?: object, profile?: object, error?: string, status?: number }>}
 */
export async function verifyServerAuth(request, options = { requireAdmin: false }) {
    try {
        let token = null;
        let user = null;

        // 1. Check for Authorization header: "Bearer <token>"
        const authHeader = request?.headers?.get?.('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7).trim();
        }

        // 2. If Bearer token is provided, verify directly via Supabase Auth
        if (token) {
            const cacheKey = `token_${token.substring(0, 32)}`;
            const cached = authVerificationCache.get(cacheKey);

            if (cached) {
                user = cached.user;
            } else {
                const { data, error } = await adminSupabase.auth.getUser(token);
                if (error || !data?.user) {
                    return { authorized: false, status: 401, error: 'Invalid or expired authorization token' };
                }
                user = data.user;
                authVerificationCache.set(cacheKey, { user }, 20); // 20s TTL
            }
        } else {
            // 3. Otherwise extract session from SSR Cookies
            const cookieStore = await cookies();
            const supabaseCookieClient = createServerClient(
                supabaseUrl,
                supabaseAnonKey,
                {
                    cookies: {
                        getAll: () => cookieStore.getAll(),
                    },
                }
            );

            const { data, error } = await supabaseCookieClient.auth.getUser();
            if (error || !data?.user) {
                return { authorized: false, status: 401, error: 'Authentication required. No active session found.' };
            }
            user = data.user;
        }

        if (!user || !user.id) {
            return { authorized: false, status: 401, error: 'Unauthorized access' };
        }

        // 4. If admin role is required, verify directly against the database `profiles` table
        if (options.requireAdmin) {
            const roleCacheKey = `role_${user.id}`;
            let profile = authVerificationCache.get(roleCacheKey);

            if (!profile) {
                const { data: dbProfile, error: profileError } = await adminSupabase
                    .from('profiles')
                    .select('id, role, first_name, last_name, email')
                    .eq('id', user.id)
                    .single();

                if (profileError || !dbProfile) {
                    return { authorized: false, status: 403, error: 'User profile not found or database error' };
                }

                profile = dbProfile;
                authVerificationCache.set(roleCacheKey, profile, 25); // 25s TTL
            }

            const role = (profile.role || '').toLowerCase().trim();
            if (role !== 'admin') {
                return { authorized: false, status: 403, error: 'Access forbidden: Administrator privileges required.' };
            }

            return { authorized: true, user, profile };
        }

        return { authorized: true, user };

    } catch (err) {
        console.error('API Gateway Auth Exception:', err);
        return { authorized: false, status: 500, error: 'Internal security gateway failure' };
    }
}
