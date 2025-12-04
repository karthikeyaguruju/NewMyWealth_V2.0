import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, generateToken } from '@/lib/jwt';

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // Public routes
    const isPublicRoute = pathname === '/login' || pathname === '/signup';

    if (pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    // If user is not authenticated and trying to access protected route
    if (!token && !isPublicRoute) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // If user is authenticated
    if (token) {
        const decoded = await verifyToken(token);

        // If token is invalid/expired
        if (!decoded) {
            // If trying to access protected route, redirect to login
            if (!isPublicRoute) {
                return NextResponse.redirect(new URL('/login', request.url));
            }
            // If public route, just let them pass (they are effectively logged out)
        } else {
            // Token is valid.
            // If user is on a public route (login/signup), redirect to dashboard
            if (isPublicRoute) {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }

            // Refresh token logic (Sliding Window)
            const response = NextResponse.next();

            // Calculate remaining time
            const now = Math.floor(Date.now() / 1000);
            const timeRemaining = decoded.exp - now;

            // Refresh if < 9 minutes remaining (1 minute passed)
            if (timeRemaining < 540) {
                const newToken = await generateToken(decoded.userId);
                response.cookies.set('token', newToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 600, // 10 minutes
                    path: '/',
                });
            }

            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
