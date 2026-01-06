import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { loginSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validatedData = loginSchema.parse(body);

        // Sign in with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: validatedData.email,
            password: validatedData.password,
        });

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            );
        }

        const { user, session } = data;

        // Fetch user profile for full name
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

        // Create response
        const response = NextResponse.json(
            {
                message: 'Login successful',
                user: {
                    id: user.id,
                    fullName: profile?.full_name || user.user_metadata?.full_name || 'User',
                    email: user.email,
                },
            },
            { status: 200 }
        );

        // Supabase session usually comes with access_token and refresh_token
        // For simple migration, we'll set a basic cookie or let the frontend handle it.
        // But since your middleware expects a 'token', we'll set the access_token.
        if (session) {
            response.cookies.set('token', session.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: session.expires_in,
                path: '/',
            });
        }

        return response;
    } catch (error: any) {
        console.error('Login error:', error);

        if (error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
