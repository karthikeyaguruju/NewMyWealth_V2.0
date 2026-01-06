import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // Public routes that don't need auth
    const isPublicRoute = pathname === '/' || pathname === '/login' || pathname === '/signup';

    // Allow API routes to handle their own security or pass through
    if (pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    // If no token exists and it's a protected route, go to login
    if (!token && !isPublicRoute) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (token) {
        // Verify token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            // Token is invalid/expired
            if (!isPublicRoute) {
                const response = NextResponse.redirect(new URL('/login', request.url));
                response.cookies.delete('token');
                return response;
            }
        } else {
            // Token is valid.
            // If user is on a public route (login/signup), redirect to dashboard
            if (isPublicRoute) {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
            // User is authenticated and on protected route, let them pass
            return NextResponse.next();
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
