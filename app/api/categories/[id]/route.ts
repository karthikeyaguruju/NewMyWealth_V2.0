import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

async function getUserId(request: NextRequest): Promise<string | null> {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const decoded = await verifyToken(token);
    return decoded?.userId || null;
}

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getUserId(request);

        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { id } = await params;

        // Check if category exists and belongs to user
        const category = await prisma.category.findFirst({
            where: { id, userId },
        });

        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        // Prevent deletion of default categories
        if (category.isDefault) {
            return NextResponse.json(
                { error: 'Cannot delete default categories' },
                { status: 400 }
            );
        }

        // Check if category is in use
        const transactionsCount = await prisma.transaction.count({
            where: { userId, category: category.name },
        });

        if (transactionsCount > 0) {
            return NextResponse.json(
                { error: 'Cannot delete category that is in use by transactions' },
                { status: 400 }
            );
        }

        // Delete category
        await prisma.category.delete({ where: { id } });

        return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Delete category error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
