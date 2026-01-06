// Analytics route - provides dashboard metrics
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

/** Extract user from Supabase token */
async function getUser(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = user.id;
    const supabaseService = getServiceSupabase();

    // Fetch all transactions and stocks
    const { data: transactions, error: txError } = await supabaseService
      .from('transactions')
      .select('*, categories(name)')
      .eq('user_id', userId);

    const { data: stocks, error: stockError } = await supabaseService
      .from('stocks')
      .select('*')
      .eq('user_id', userId);

    if (txError || stockError) throw txError || stockError;

    const allTx = transactions || [];
    const allStocks = stocks || [];

    // Date boundaries
    const now = new Date();
    const startOfThisMonth = startOfMonth(now);
    const endOfThisMonth = endOfMonth(now);
    const startOfLastMonth = startOfMonth(subMonths(now, 1));

    // Filter transactions by current month
    const thisMonthTx = allTx.filter(t => {
      const d = new Date(t.date);
      return d >= startOfThisMonth && d <= endOfThisMonth;
    });

    const lastMonthTx = allTx.filter(t => {
      const d = new Date(t.date);
      return d >= startOfLastMonth && d < startOfThisMonth;
    });

    // Filter stocks by current month (purchase date)
    const thisMonthStocks = allStocks.filter(s => {
      const d = new Date(s.date);
      return d >= startOfThisMonth && d <= endOfThisMonth;
    });

    // THIS MONTH metrics (for Dashboard)
    const thisMonthIncome = thisMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const thisMonthExpenses = thisMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const thisMonthInvestmentsTx = thisMonthTx.filter(t => t.type === 'investment').reduce((s, t) => s + Number(t.amount), 0);
    const thisMonthStocksValue = thisMonthStocks.reduce((s, stock) => s + (Number(stock.quantity) * Number(stock.buy_price)), 0);
    const thisMonthInvestments = thisMonthInvestmentsTx + thisMonthStocksValue;

    // LAST MONTH metrics (for growth calculation)
    const lastMonthIncome = lastMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const lastMonthExpenses = lastMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

    // Growth calculations
    const incomeGrowth = lastMonthIncome > 0 ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
    const expenseGrowth = lastMonthExpenses > 0 ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;

    // ALL TIME metrics (for Analytics page)
    const totalIncome = allTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const totalExpenses = allTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const totalInvestmentsTx = allTx.filter(t => t.type === 'investment').reduce((s, t) => s + Number(t.amount), 0);
    const totalStocksValue = allStocks.reduce((s, stock) => s + (Number(stock.quantity) * Number(stock.buy_price)), 0);
    const totalInvestments = totalInvestmentsTx + totalStocksValue;

    // Category Breakdowns - ALL TIME (for Analytics page)
    const getBreakdown = (type: string, txList: any[] = allTx) => {
      const counts: Record<string, number> = {};
      txList.filter(t => t.type === type).forEach(t => {
        const name = (t.categories as { name: string } | null)?.name || 'Uncategorized';
        counts[name] = (counts[name] || 0) + Number(t.amount);
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    };

    // THIS MONTH category breakdowns (for Dashboard)
    const thisMonthIncomeBreakdown = getBreakdown('income', thisMonthTx);
    const thisMonthExpenseBreakdown = getBreakdown('expense', thisMonthTx);
    const thisMonthInvestmentBreakdown = getBreakdown('investment', thisMonthTx);

    // Recent transactions - 5 MOST RECENT from ALL TIME (for Dashboard)
    const recentTransactions = allTx
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        category: (t.categories as { name: string } | null)?.name || 'Uncategorized',
        description: t.notes || '',
        date: t.date
      }));

    // Get query parameters for chart granularity
    const { searchParams } = new URL(request.url);
    const granularity = searchParams.get('granularity') || 'month';
    const historyMonths = parseInt(searchParams.get('historyMonths') || '6');
    const daysParam = parseInt(searchParams.get('days') || '30');

    // Generate chart data based on granularity
    const chartData = [];

    if (granularity === 'day') {
      // Daily granularity - for 7 days or 1 month view
      const numDays = daysParam;
      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);

        const nextDay = new Date(d);
        nextDay.setDate(nextDay.getDate() + 1);

        const dayTx = allTx.filter(t => {
          const dt = new Date(t.date);
          return dt >= d && dt < nextDay;
        });

        chartData.push({
          label: format(d, 'dd MMM'), // e.g., "01 Jan", "02 Jan"
          income: dayTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
          expense: dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
          investment: dayTx.filter(t => t.type === 'investment').reduce((s, t) => s + Number(t.amount), 0),
        });
      }
    } else {
      // Monthly granularity - for 3M, 6M, 1Y, All Time views
      const numMonths = historyMonths;
      for (let i = numMonths - 1; i >= 0; i--) {
        const d = subMonths(now, i);
        const mStart = startOfMonth(d);
        const mEnd = endOfMonth(d);
        const mTx = allTx.filter(t => {
          const dt = new Date(t.date);
          return dt >= mStart && dt <= mEnd;
        });

        chartData.push({
          label: format(d, 'MMM yyyy'), // e.g., "Jan 2026"
          income: mTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
          expense: mTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
          investment: mTx.filter(t => t.type === 'investment').reduce((s, t) => s + Number(t.amount), 0),
        });
      }
    }

    return NextResponse.json({
      // THIS MONTH - for Dashboard
      thisMonth: {
        income: thisMonthIncome,
        expenses: thisMonthExpenses,
        investments: thisMonthInvestments,
        netSavings: thisMonthIncome - thisMonthExpenses,
        savingsRate: thisMonthIncome > 0 ? ((thisMonthIncome - thisMonthExpenses) / thisMonthIncome) * 100 : 0,
        incomeGrowth,
        expenseGrowth,
        // This month's breakdowns
        incomeBreakdown: thisMonthIncomeBreakdown,
        expenseBreakdown: thisMonthExpenseBreakdown,
        investmentBreakdown: thisMonthInvestmentBreakdown,
        // Transaction counts for this month
        transactionCount: thisMonthTx.length,
        stockCount: thisMonthStocks.length,
      },
      // 5 Most recent transactions (all time) - for Dashboard
      recentTransactions,
      // ALL TIME - for Analytics page
      metrics: {
        totalIncome,
        totalExpenses,
        netSavings: totalIncome - totalExpenses,
        totalInvestments,
        thisMonthIncome,
        thisMonthExpenses,
        savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
        incomeGrowth,
        expenseGrowth,
        investmentGrowth: 0,
      },
      monthlyData: chartData,
      incomeBreakdown: getBreakdown('income'),
      expenseBreakdown: getBreakdown('expense'),
      investmentAllocation: getBreakdown('investment'),
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
