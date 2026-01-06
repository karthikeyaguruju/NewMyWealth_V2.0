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

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = stockSchema.parse(body);

        const supabaseService = getServiceSupabase();

        const { data: stock, error } = await supabaseService
            .from('stocks')
            .update({
                symbol: validatedData.symbol.toUpperCase(),
                name: validatedData.name,
                quantity: validatedData.quantity,
                buy_price: validatedData.buyPrice,
                broker: validatedData.broker,
                type: validatedData.type.toUpperCase(),
                date: validatedData.date ? new Date(validatedData.date).toISOString() : undefined,
            })
            .eq('id', params.id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ stock }, { status: 200 });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const supabaseService = getServiceSupabase();

        const { error } = await supabaseService
            .from('stocks')
            .delete()
            .eq('id', params.id)
            .eq('user_id', user.id);

        if (error) throw error;

        return NextResponse.json({ message: 'Stock deleted successfully' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

