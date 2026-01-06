import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { startOfMonth, endOfMonth, format } from 'date-fns';

async function getUser(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
}

// GET /api/budgets - Get budgets with spending progress
export async function GET(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const monthParam = searchParams.get('month'); // YYYY-MM
        const currentMonth = monthParam || format(new Date(), 'yyyy-MM');

        // Parse month dates for spending lookup
        const [year, month] = currentMonth.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1).toISOString();
        const endDate = endOfMonth(new Date(year, month - 1, 1)).toISOString();

        // 1. Get budgets for this user and month
        const { data: budgets, error: budgetErr } = await supabase
            .from('budgets')
            .select('*, categories(name)')
            .eq('user_id', user.id)
            .eq('month', currentMonth);

        if (budgetErr) throw budgetErr;

        // 2. Get all expenses for this user in this month to calculate progress
        const { data: transactions, error: txErr } = await supabase
            .from('transactions')
            .select('amount, category_id')
            .eq('user_id', user.id)
            .eq('type', 'expense')
            .gte('date', startDate)
            .lte('date', endDate);

        if (txErr) throw txErr;

        // 3. Combine data
        const budgetsWithProgress = budgets.map(budget => {
            const spent = transactions
                .filter(t => t.category_id === budget.category_id)
                .reduce((sum, t) => sum + Number(t.amount), 0);

            return {
                ...budget,
                category: budget.categories?.name || 'Unknown',
                spent
            };
        });

        return NextResponse.json(budgetsWithProgress);
    } catch (error) {
        console.error('Get budgets error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/budgets - Create/Update a budget
export async function POST(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { category: categoryName, amount, month } = body;

        // Find the category ID by name
        const { data: category, error: catErr } = await supabase
            .from('categories')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', categoryName)
            .single();

        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        // Upsert the budget
        const { data: budget, error: budgetErr } = await supabase
            .from('budgets')
            .upsert({
                user_id: user.id,
                category_id: category.id,
                amount: parseFloat(amount),
                month: month
            }, { onConflict: 'user_id, category_id, month' })
            .select('*, categories(name)')
            .single();

        if (budgetErr) throw budgetErr;

        return NextResponse.json({
            ...budget,
            category: budget.categories?.name || categoryName
        }, { status: 201 });

    } catch (error) {
        console.error('Create budget error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
