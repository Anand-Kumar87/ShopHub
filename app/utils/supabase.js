import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url, options) => {
      // अगर Supabase 8 सेकंड में रिप्लाई न दे, तो रिक्वेस्ट को कैंसिल कर दो ताकि बिल्ड न लटके
      return fetch(url, { ...options, signal: AbortSignal.timeout(8000) });
    }
  }
});
