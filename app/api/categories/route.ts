import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

// Helper to get user ID from token
async function getUserId(request: NextRequest): Promise<string | null> {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const decoded = await verifyToken(token);
    return decoded?.userId || null;
}

// GET /api/categories - Get all categories for user
export async function GET(request: NextRequest) {
    try {
        const userId = await getUserId(request);

        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const categoryGroup = searchParams.get('categoryGroup');

        const categories = await prisma.category.findMany({
            where: {
                userId,
                ...(categoryGroup && { categoryGroup }),
            },
            orderBy: [
                { isDefault: 'desc' },
                { name: 'asc' },
            ],
        });

        return NextResponse.json({ categories }, { status: 200 });
    } catch (error) {
        console.error('Get categories error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
    try {
        const userId = await getUserId(request);

        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { categoryGroup, name } = body;

        if (!categoryGroup || !name) {
            return NextResponse.json(
                { error: 'Category group and name are required' },
                { status: 400 }
            );
        }

        const category = await prisma.category.create({
            data: {
                userId,
                categoryGroup,
                name,
                isDefault: false,
            },
        });

        return NextResponse.json({ category }, { status: 201 });
    } catch (error) {
        console.error('Create category error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
