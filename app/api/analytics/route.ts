// Analytics route - provides dashboard metrics
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

/**
 * Extract the userId from the JWT token stored in cookies.
 */
async function getUserId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  const decoded = await verifyToken(token);
  return decoded?.userId || null;
}

/**
 * GET /api/analytics
 * Returns a collection of aggregated metrics used by the dashboard.
 * Supports optional `startDate` and `endDate` query parameters (YYYY-MM-DD).
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    // Convert query strings to Date objects (if supplied)
    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    // Fetch transactions for the user, optionally filtered by date range
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        ...(startDate && endDate && {
          date: { gte: startDate, lte: endDate },
        }),
      },
    });

    // ---------- Aggregate calculations ----------
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalInvestments = transactions
      .filter((t) => t.type === 'investment')
      .reduce((sum, t) => sum + t.amount, 0);
    const netSavings = totalIncome - totalExpenses;

    // ----- This month statistics -----
    const thisMonthStart = new Date(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const thisMonthEnd = new Date(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    const thisMonthTx = transactions.filter(
      (t) => t.date >= thisMonthStart && t.date <= thisMonthEnd
    );
    const thisMonthIncome = thisMonthTx
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const thisMonthExpenses = thisMonthTx
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const thisMonthInvestments = thisMonthTx
      .filter((t) => t.type === 'investment')
      .reduce((sum, t) => sum + t.amount, 0);

    // ----- Last month for growth calculations -----
    const lastMonthDate = subMonths(new Date(), 1);
    const lastMonthStart = new Date(format(startOfMonth(lastMonthDate), 'yyyy-MM-dd'));
    const lastMonthEnd = new Date(format(endOfMonth(lastMonthDate), 'yyyy-MM-dd'));
    const lastMonthTx = transactions.filter(
      (t) => t.date >= lastMonthStart && t.date <= lastMonthEnd
    );
    const lastMonthIncome = lastMonthTx
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const lastMonthExpenses = lastMonthTx
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const lastMonthInvestments = lastMonthTx
      .filter((t) => t.type === 'investment')
      .reduce((sum, t) => sum + t.amount, 0);

    const incomeGrowth =
      lastMonthIncome > 0 ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
    const expenseGrowth =
      lastMonthExpenses > 0 ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;
    const investmentGrowth =
      lastMonthInvestments > 0 ? ((thisMonthInvestments - lastMonthInvestments) / lastMonthInvestments) * 100 : 0;

    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    // ----- Monthly data for charts (default 6 months) -----
    const historyMonths = searchParams.get('historyMonths')
      ? parseInt(searchParams.get('historyMonths')!)
      : 6;
    const monthlyData: any[] = [];
    for (let i = historyMonths - 1; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = new Date(format(startOfMonth(monthDate), 'yyyy-MM-dd'));
      const monthEnd = new Date(format(endOfMonth(monthDate), 'yyyy-MM-dd'));
      const monthLabel = format(monthDate, 'MMM yyyy');
      const monthTx = transactions.filter(
        (t) => t.date >= monthStart && t.date <= monthEnd
      );
      const income = monthTx
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTx
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const investment = monthTx
        .filter((t) => t.type === 'investment')
        .reduce((sum, t) => sum + t.amount, 0);
      monthlyData.push({
        month: monthLabel,
        income,
        expense,
        investment,
        savings: income - expense,
      });
    }

    // ----- Category breakdowns -----
    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};
    const investmentByCategory: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.type === 'income') {
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
      } else if (t.type === 'expense') {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      } else if (t.type === 'investment') {
        investmentByCategory[t.category] = (investmentByCategory[t.category] || 0) + t.amount;
      }
    });
    const incomeBreakdown = Object.entries(incomeByCategory).map(([name, value]) => ({ name, value }));
    const expenseBreakdown = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));
    const investmentAllocation = Object.entries(investmentByCategory).map(([name, value]) => ({ name, value }));

    // ----- Response -----
    return NextResponse.json(
      {
        metrics: {
          totalIncome,
          totalExpenses,
          netSavings,
          totalInvestments,
          thisMonthIncome,
          thisMonthExpenses,
          savingsRate: Math.round(savingsRate * 100) / 100,
          incomeGrowth,
          expenseGrowth,
          investmentGrowth,
        },
        monthlyData,
        incomeBreakdown,
        expenseBreakdown,
        investmentAllocation,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
