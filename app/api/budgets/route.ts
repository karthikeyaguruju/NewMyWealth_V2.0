// Budgets API route
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { startOfMonth, endOfMonth, format } from 'date-fns';

async function getUserId(request: NextRequest): Promise<string | null> {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    const decoded = await verifyToken(token);
    return decoded?.userId || null;
}

// GET /api/budgets - Get budgets with spending progress
export async function GET(request: NextRequest) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const monthParam = searchParams.get('month'); // Format: YYYY-MM

        const currentMonth = monthParam || format(new Date(), 'yyyy-MM');

        // Get budgets for the specified month
        const budgets = await prisma.budget.findMany({
            where: {
                userId,
                month: currentMonth,
            },
            include: {
                category: true,
            },
        });

        // Calculate spending for each budget
        const budgetsWithProgress = await Promise.all(budgets.map(async (budget) => {
            // Construct Date objects for the start and end of the month
            const [year, month] = currentMonth.split('-').map(Number);
            const startDate = new Date(year, month - 1, 1); // Local time start of month
            const endDate = endOfMonth(startDate); // Local time end of month

            const expenses = await prisma.transaction.aggregate({
                where: {
                    userId,
                    type: 'expense',
                    category: budget.category.name, // Use name from relation
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                _sum: {
                    amount: true,
                },
            });

            return {
                ...budget,
                category: budget.category.name, // Flatten for frontend compatibility
                spent: expenses._sum.amount || 0,
            };
        }));

        return NextResponse.json(budgetsWithProgress);
    } catch (error) {
        console.error('Get budgets error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/budgets - Create a new budget
export async function POST(request: NextRequest) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { category: categoryName, amount, month } = body;

        if (!categoryName || !amount || !month) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Find the category first to get its ID
        const categoryObj = await prisma.category.findFirst({
            where: {
                userId,
                name: categoryName,
            },
        });

        if (!categoryObj) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        // Check if budget already exists for this category and month
        const existingBudget = await prisma.budget.findFirst({
            where: {
                userId,
                categoryId: categoryObj.id,
                month,
            },
        });

        if (existingBudget) {
            // Update existing instead of failing
            const updatedBudget = await prisma.budget.update({
                where: { id: existingBudget.id },
                data: { amount: parseFloat(amount) },
                include: { category: true },
            });
            return NextResponse.json({
                ...updatedBudget,
                category: updatedBudget.category.name,
            });
        }

        const budget = await prisma.budget.create({
            data: {
                userId,
                categoryId: categoryObj.id,
                amount: parseFloat(amount),
                month,
            },
            include: { category: true },
        });

        return NextResponse.json({
            ...budget,
            category: budget.category.name,
        }, { status: 201 });

    } catch (error) {
        console.error('Create budget error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
