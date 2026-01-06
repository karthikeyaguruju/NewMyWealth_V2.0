// Analytics route - provides dashboard metrics
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

    // Use service role to bypass RLS
    const supabaseService = getServiceSupabase();

    // Fetch all relevant data from Supabase
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

    // Aggregates
    const totalIncome = allTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const totalExpenses = allTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const totalInvestments = allTx.filter(t => t.type === 'investment').reduce((s, t) => s + Number(t.amount), 0);

    // Month Logic
    const startOfThisMonth = startOfMonth(new Date());
    const startOfLastMonth = startOfMonth(subMonths(new Date(), 1));

    const thisMonthTx = allTx.filter(t => new Date(t.date) >= startOfThisMonth);
    const lastMonthTx = allTx.filter(t => {
      const d = new Date(t.date);
      return d >= startOfLastMonth && d < startOfThisMonth;
    });

    const thisMonthIncome = thisMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const lastMonthIncome = lastMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);

    const thisMonthExpenses = thisMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const lastMonthExpenses = lastMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

    const incomeGrowth = lastMonthIncome > 0 ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
    const expenseGrowth = lastMonthExpenses > 0 ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;

    // Category Breakdowns
    const getBreakdown = (type: string) => {
      const counts: Record<string, number> = {};
      allTx.filter(t => t.type === type).forEach(t => {
        const name = (t.categories as { name: string } | null)?.name || 'Uncategorized';
        counts[name] = (counts[name] || 0) + Number(t.amount);
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    };

    // Chart Data (6 months)
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const mStart = startOfMonth(d);
      const mEnd = endOfMonth(d);
      const mTx = allTx.filter(t => {
        const dt = new Date(t.date);
        return dt >= mStart && dt <= mEnd;
      });

      chartData.push({
        label: format(d, 'MMM yyyy'),
        income: mTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
        expense: mTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
        investment: mTx.filter(t => t.type === 'investment').reduce((s, t) => s + Number(t.amount), 0),
      });
    }

    return NextResponse.json({
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
