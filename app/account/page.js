import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import AccountContent from './AccountContent';

export default async function AccountPage() {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
            },
        }
    );

    // Only the auth check happens server-side (fast — a single call).
    // The heavier profile/orders/payments/coupons queries now happen
    // client-side via SWR (see AccountContent.js) so that navigating
    // away and back reuses cached data instantly instead of redoing
    // all 4 queries — and 4 slow queries no longer block this page
    // from rendering at all.
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
        redirect('/login');
    }

    return <AccountContent />;
}
