// Transactions API routes
import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';
import { transactionSchema } from '@/lib/validations';

/** Extract user from Supabase token */
async function getUser(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        console.error('Supabase Auth error:', error);
        return null;
    }
    return user;
}

/** GET /api/transactions – list with filters, sorting, pagination */
export async function GET(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const category = searchParams.get('category');
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');
        const minAmount = searchParams.get('minAmount');
        const maxAmount = searchParams.get('maxAmount');
        const description = searchParams.get('description');
        const sortBy = searchParams.get('sortBy') || 'date';
        const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        // Use service role to bypass RLS
        const supabaseService = getServiceSupabase();

        // Build Supabase query
        let query = supabaseService
            .from('transactions')
            .select('*, categories(name)', { count: 'exact' })
            .eq('user_id', user.id);


        if (type) query = query.eq('type', type);
        // category in Postgres table is category_id (UUID), but frontend might send name.
        // For simplicity, we filter by name if checking against categories table
        if (category) query = query.ilike('notes', `%${category}%`); // Adjust based on your UI needs

        if (startDateStr) query = query.gte('date', startDateStr);
        if (endDateStr) query = query.lte('date', endDateStr);
        if (minAmount) query = query.gte('amount', parseFloat(minAmount));
        if (maxAmount) query = query.lte('amount', parseFloat(maxAmount));
        if (description) query = query.ilike('notes', `%${description}%`);

        // Order and Pagination
        const { data: transactions, count, error } = await query
            .order(sortBy, { ascending: order === 'asc' })
            .range(skip, skip + limit - 1);

        if (error) throw error;

        // Map Supabase fields to frontend fields
        const mappedTransactions = (transactions || []).map(t => ({
            ...t,
            category: (t.categories as { name: string } | null)?.name || 'Uncategorized',
            description: t.notes || ''
        }));

        return NextResponse.json({
            transactions: mappedTransactions,
            pagination: {
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
                page,
                limit
            },
        }, { status: 200 });
    } catch (error) {
        console.error('Get transactions error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/** POST /api/transactions – create a new transaction */
export async function POST(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = transactionSchema.parse(body);

        // Convert date string (YYYY-MM-DD) to ISO format
        const [year, month, day] = validatedData.date.split('-').map(Number);
        const dateObject = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

        // Use service role to bypass RLS
        const supabaseService = getServiceSupabase();

        const { data: transaction, error } = await supabaseService
            .from('transactions')
            .insert({
                user_id: user.id,
                type: validatedData.type.toLowerCase(),
                amount: validatedData.amount,
                date: dateObject.toISOString(),
                notes: validatedData.notes,
                category_id: validatedData.categoryId || null,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ transaction }, { status: 201 });
    } catch (error: any) {
        console.error('Create transaction error:', error);
        if (error.name === 'ZodError') {
            return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
