import { NextResponse } from 'next/server';

export function middleware(request) {
    // Current URL nikalna
    const path = request.nextUrl.pathname;

    // Sirf client-side se check karna thoda tricky hota hai middleware mein, 
    // par Next.js cookies ka use karke isko strongly protect kar sakta hai.
    // Jab hum Supabase Auth use karte hain, toh wo automatically ek cookie set karta hai 'sb-[project-id]-auth-token'

    // Lekin simple role-checking ke liye, hum ek soft protection laga sakte hain 
    // jo browser pe chalne wale dashboard ko redirect karega agar user admin nahi hai.

    // Yahan hum simply define kar rahe hain ki kin paths ko protect karna hai
    const isProtectedRoute = path.startsWith('/account');
    const isAdminRoute = path.startsWith('/admin');

    // NOTE: Real robust protection Supabase SSR cookies se hoti hai, 
    // par abhi frontend logic ke hisaab se hum pages ke andar useEffect se isko enforce karenge.

    return NextResponse.next();
}

// Ye define karta hai ki middleware kahan kahan chalega
export const config = {
    matcher: ['/account/:path*', '/admin/:path*'],
};