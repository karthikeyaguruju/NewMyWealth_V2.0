import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { signupSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = signupSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { fullName, email, password } = validation.data;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        const hashedPassword = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                fullName,
                email,
                passwordHash: hashedPassword,
            },
        });

        // Seed default categories
        const defaultCategories = [
            { name: 'Salary', categoryGroup: 'Income', isDefault: true },
            { name: 'Freelancing', categoryGroup: 'Income', isDefault: true },
            { name: 'Investments', categoryGroup: 'Income', isDefault: true },
            { name: 'Rent', categoryGroup: 'Expense', isDefault: true },
            { name: 'Groceries', categoryGroup: 'Expense', isDefault: true },
            { name: 'Utilities', categoryGroup: 'Expense', isDefault: true },
            { name: 'Entertainment', categoryGroup: 'Expense', isDefault: true },
            { name: 'Transportation', categoryGroup: 'Expense', isDefault: true },
            { name: 'Healthcare', categoryGroup: 'Expense', isDefault: true },
            { name: 'Stocks', categoryGroup: 'Investment', isDefault: true },
            { name: 'Mutual Funds', categoryGroup: 'Investment', isDefault: true },
            { name: 'Real Estate', categoryGroup: 'Investment', isDefault: true },
            { name: 'Crypto', categoryGroup: 'Investment', isDefault: true },
            { name: 'Gold', categoryGroup: 'Investment', isDefault: true },
            { name: 'Bonds', categoryGroup: 'Investment', isDefault: true },
        ];

        await prisma.category.createMany({
            data: defaultCategories.map(cat => ({ ...cat, userId: user.id })),
        });

        return NextResponse.json(
            { message: 'User created successfully' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
