// Investments API route
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

async function getUserId(request: NextRequest): Promise<string | null> {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    const decoded = await verifyToken(token);
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
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');

        // Convert query strings to Date objects
        const startDate = startDateStr ? new Date(startDateStr) : undefined;
        const endDate = endDateStr ? new Date(endDateStr) : undefined;

        // Get all investment transactions first
        const [allInvestments, stocks] = await Promise.all([
            prisma.transaction.findMany({
                where: {
                    userId,
                    type: 'investment',
                    // Apply date filter if provided
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
            }),
            prisma.stock.findMany({
                where: { userId }
            })
        ]);

        // Filter out terminated investments in JavaScript
        const investments = allInvestments.filter(t => t.status !== 'terminated');

        // Group by category
        const byCategory: Record<string, number> = {};
        investments.forEach((t) => {
            byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
        });

        // Add Stock data to categories
        // Group raw stock transactions by symbol to get active holdings
        const stockHoldings = stocks.reduce((acc: any, stock: any) => {
            const symbol = stock.symbol.toUpperCase();
            if (!acc[symbol]) {
                acc[symbol] = { quantity: 0, totalInvested: 0 };
            }

            if (stock.type === 'BUY') {
                acc[symbol].quantity += stock.quantity;
                acc[symbol].totalInvested += (stock.quantity * stock.buyPrice);
            } else {
                acc[symbol].quantity -= stock.quantity;
                const avgCost = acc[symbol].totalInvested / (acc[symbol].quantity + stock.quantity);
                acc[symbol].totalInvested -= (stock.quantity * avgCost);
            }
            return acc;
        }, {});

        let totalStockInvested = 0;
        Object.values(stockHoldings).forEach((holding: any) => {
            if (holding.quantity > 0) {
                totalStockInvested += holding.totalInvested;
            }
        });

        if (totalStockInvested > 0) {
            byCategory['Equity Stocks'] = (byCategory['Equity Stocks'] || 0) + totalStockInvested;
        }

        // Total invested (Transactions + Stocks)
        const totalInvested = Object.values(byCategory).reduce((sum, amt) => sum + amt, 0);

        const categoryBreakdown = Object.entries(byCategory).map(([category, amount]) => ({
            category,
            amount,
        }));

        // Investment allocation for chart
        const allocation = Object.entries(byCategory).map(([name, value]) => ({
            name,
            value,
        }));

        // Unified data for trends (Investments + Stock Transactions)
        const unifiedTransactions = [
            ...investments.map(t => ({ date: new Date(t.date), amount: t.amount })),
            ...stocks.map(s => ({
                date: new Date(s.date || s.createdAt),
                amount: s.type === 'BUY' ? (s.quantity * s.buyPrice) : -(s.quantity * (s.sellPrice || s.buyPrice))
            }))
        ];

        // Generate trend data based on historyMonths
        const historyMonths = searchParams.get('historyMonths') ? parseInt(searchParams.get('historyMonths')!) : 6;
        const monthlyData: any[] = [];
        const today = new Date();

        // Calculate this month's and last month's totals for growth
        const thisMonthStart = startOfMonth(today);
        const lastMonthDate = subMonths(today, 1);
        const lastMonthStart = startOfMonth(lastMonthDate);
        const lastMonthEnd = endOfMonth(lastMonthDate);

        const thisMonthTotal = unifiedTransactions
            .filter(t => t.date >= thisMonthStart)
            .reduce((sum, t) => sum + t.amount, 0);

        const lastMonthTotal = unifiedTransactions
            .filter(t => t.date >= lastMonthStart && t.date <= lastMonthEnd)
            .reduce((sum, t) => sum + t.amount, 0);

        const monthlyGrowth = lastMonthTotal > 0
            ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
            : 0;

        for (let i = historyMonths - 1; i >= 0; i--) {
            const monthDate = subMonths(today, i);
            const monthStart = startOfMonth(monthDate);
            const monthEnd = endOfMonth(monthDate);
            const monthLabel = format(monthDate, 'MMM yyyy');

            const monthTx = unifiedTransactions.filter(
                (t) => t.date >= monthStart && t.date <= monthEnd
            );

            const amount = monthTx.reduce((sum, t) => sum + t.amount, 0);
            const count = monthTx.length;

            monthlyData.push({
                month: monthLabel,
                amount: Math.max(0, amount), // Show 0 if net is negative, though unlikely for capital deployed
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
