import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

async function getUserId(request: NextRequest): Promise<string | null> {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    return decoded?.userId || null;
}

// GET /api/investments - Get investment analytics
export async function GET(request: NextRequest) {
    try {
        const userId = await getUserId(request);

        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Get all investment transactions
        const investments = await prisma.transaction.findMany({
            where: {
                userId,
                type: 'investment',
                ...(startDate && endDate && {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                }),
            },
            orderBy: {
                date: 'asc',
            },
        });

        // Total invested
        const totalInvested = investments.reduce((sum, t) => sum + t.amount, 0);

        // Group by category
        const byCategory: Record<string, number> = {};
        investments.forEach((t) => {
            byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
        });

        const categoryBreakdown = Object.entries(byCategory).map(([category, amount]) => ({
            category,
            amount,
        }));

        // Investment allocation for chart
        const allocation = Object.entries(byCategory).map(([name, value]) => ({
            name,
            value,
        }));

        // Generate trend data based on historyMonths
        const historyMonths = searchParams.get('historyMonths') ? parseInt(searchParams.get('historyMonths')!) : 6;
        const monthlyData: any[] = [];
        const today = new Date();

        // Calculate this month's and last month's totals for growth
        const thisMonthStart = format(startOfMonth(today), 'yyyy-MM-dd');
        const lastMonthDate = subMonths(today, 1);
        const lastMonthStart = format(startOfMonth(lastMonthDate), 'yyyy-MM-dd');
        const lastMonthEnd = format(endOfMonth(lastMonthDate), 'yyyy-MM-dd');

        const thisMonthTotal = investments
            .filter(t => t.date >= thisMonthStart)
            .reduce((sum, t) => sum + t.amount, 0);

        const lastMonthTotal = investments
            .filter(t => t.date >= lastMonthStart && t.date <= lastMonthEnd)
            .reduce((sum, t) => sum + t.amount, 0);

        const monthlyGrowth = lastMonthTotal > 0
            ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
            : 0;

        for (let i = historyMonths - 1; i >= 0; i--) {
            const monthDate = subMonths(today, i);
            const monthStart = format(startOfMonth(monthDate), 'yyyy-MM-dd');
            const monthEnd = format(endOfMonth(monthDate), 'yyyy-MM-dd');
            const monthLabel = format(monthDate, 'MMM yyyy');

            const monthInvestments = investments.filter(
                (t) => t.date >= monthStart && t.date <= monthEnd
            );

            const amount = monthInvestments.reduce((sum, t) => sum + t.amount, 0);
            const count = monthInvestments.length;

            monthlyData.push({
                month: monthLabel,
                amount,
                count,
            });
        }

        return NextResponse.json({
            totalInvested,
            categoryCount: Object.keys(byCategory).length,
            monthlyGrowth,
            categoryBreakdown,
            allocation,
            monthlyData,
        }, { status: 200 });
    } catch (error) {
        console.error('Get investments error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
