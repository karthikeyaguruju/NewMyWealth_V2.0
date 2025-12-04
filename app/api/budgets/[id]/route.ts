import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

async function getUserId(request: NextRequest): Promise<string | null> {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const decoded = await verifyToken(token);
    return decoded?.userId || null;
}

// PUT /api/budgets/[id] - Update budget
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { amount } = body;

        if (!amount) {
            return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
        }

        const budget = await prisma.budget.findUnique({
            where: { id: params.id },
        });

        if (!budget || budget.userId !== userId) {
            return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
        }

        const updatedBudget = await prisma.budget.update({
            where: { id: params.id },
            data: { amount: parseFloat(amount) },
        });

        return NextResponse.json(updatedBudget);
    } catch (error) {
        console.error('Update budget error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/budgets/[id] - Delete budget
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const budget = await prisma.budget.findUnique({
            where: { id: params.id },
        });

        if (!budget || budget.userId !== userId) {
            return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
        }

        await prisma.budget.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: 'Budget deleted' });
    } catch (error) {
        console.error('Delete budget error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
