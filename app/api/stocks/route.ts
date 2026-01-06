import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';
import { stockSchema } from '@/lib/validations';

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

        const searchParams = request.nextUrl.searchParams;
        const page = searchParams.get('page');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search');
        const type = searchParams.get('type');

        // Use service role to bypass RLS
        const supabaseService = getServiceSupabase();

        let query = supabaseService
            .from('stocks')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id);

        if (search) {
            query = query.or(`symbol.ilike.%${search}%,name.ilike.%${search}%`);
        }

        if (type && type !== 'all') {
            query = query.eq('type', type.toUpperCase());
        }

        // Order by purchase date (not created_at)
        query = query.order('date', { ascending: false });

        let total = 0;
        let stocks = [];

        if (page) {
            const pageNum = parseInt(page);
            const from = (pageNum - 1) * limit;
            const to = from + limit - 1;
            const { data, count, error } = await query.range(from, to);
            if (error) throw error;
            stocks = data;
            total = count || 0;
        } else {
            const { data, count, error } = await query;
            if (error) throw error;
            stocks = data;
            total = count || 0;
        }

        // Map snake_case to camelCase for frontend
        const mappedStocks = (stocks || []).map(s => ({
            id: s.id,
            userId: s.user_id,
            symbol: s.symbol,
            name: s.name,
            quantity: Number(s.quantity),
            buyPrice: Number(s.buy_price),
            sellPrice: s.sell_price ? Number(s.sell_price) : null,
            currentPrice: s.current_price ? Number(s.current_price) : null,
            broker: s.broker,
            type: s.type,
            date: s.date,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
            totalValue: Number(s.quantity) * Number(s.buy_price)
        }));

        return NextResponse.json({
            stocks: mappedStocks,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page ? parseInt(page) : 1,
                limit
            }
        });
    } catch (error) {
        console.error('Get stocks error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = stockSchema.parse(body);

        // Use service role to bypass RLS
        const supabaseService = getServiceSupabase();

        const { data: stock, error } = await supabaseService
            .from('stocks')
            .insert({
                user_id: user.id,
                symbol: validatedData.symbol.toUpperCase(),
                name: validatedData.name,
                quantity: validatedData.quantity,
                buy_price: validatedData.buyPrice,
                broker: validatedData.broker,
                type: validatedData.type.toUpperCase(),
                date: validatedData.date ? new Date(validatedData.date).toISOString() : new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ stock, averaged: false }, { status: 201 });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
        }
        console.error('Stock creation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
