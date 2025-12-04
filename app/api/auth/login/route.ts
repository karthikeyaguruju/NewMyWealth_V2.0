import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { comparePassword } from '@/lib/auth';
import { generateToken } from '@/lib/jwt';
import { loginSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
    try {
        console.time('Login Total');
        const body = await request.json();

        // Validate input
        const validatedData = loginSchema.parse(body);

        // Find user
        console.time('DB Find User');
        const user = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });
        console.timeEnd('DB Find User');

        if (!user) {
            console.timeEnd('Login Total');
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Verify password
        console.time('Password Compare');
        const isValidPassword = await comparePassword(
            validatedData.password,
            user.passwordHash
        );
        console.timeEnd('Password Compare');

        if (!isValidPassword) {
            console.timeEnd('Login Total');
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Generate JWT token
        console.time('Token Gen');
        const token = await generateToken(user.id);
        console.timeEnd('Token Gen');

        // Create response
        const response = NextResponse.json(
            {
                message: 'Login successful',
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                },
            },
            { status: 200 }
        );

        // Set httpOnly cookie
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 600, // 10 minutes
            path: '/',
        });

        console.timeEnd('Login Total');
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
