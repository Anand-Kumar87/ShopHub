import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Universal Isomorphic Supabase Client:
// - Browser: Uses createBrowserClient from @supabase/ssr for auth cookies & session persistence
// - Server: Uses stateless createClient from @supabase/supabase-js to avoid cookie listener overhead and SSR timeouts
export const supabase = typeof window !== 'undefined'
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });