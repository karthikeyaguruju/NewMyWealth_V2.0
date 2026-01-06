import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '0b660c484dmsh36da1690e37f3a2p19a993jsn9f650c04dd24';
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'yahoo-finance15.p.rapidapi.com';

async function getUser(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const supabaseService = getServiceSupabase();

        // Get all user's stocks
        const { data: stocks, error: stockError } = await supabaseService
            .from('stocks')
            .select('id, symbol')
            .eq('user_id', user.id);

        if (stockError) throw stockError;

        if (!stocks || stocks.length === 0) {
            return NextResponse.json({ message: 'No stocks to update' }, { status: 200 });
        }

        // Format symbols for Indian stocks
        const symbols = stocks.map(s => {
            const sym = s.symbol.trim().toUpperCase();

            // If user already specified the exchange, respect it
            if (sym.endsWith('.NS') || sym.endsWith('.BO')) {
                return sym;
            }

            // Otherwise, apply heuristic
            const isNumeric = /^\d+$/.test(sym);
            return isNumeric ? `${sym}.BO` : `${sym}.NS`;
        }).join(',');

        // Fetch live prices from Yahoo Finance via RapidAPI
        const url = `https://yahoo-finance15.p.rapidapi.com/api/v1/markets/stock/quotes?ticker=${symbols}`;
        const response = await fetch(url, {
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': RAPIDAPI_HOST,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch prices from RapidAPI');
        }

        const data = await response.json();
        const priceData = data.body || [];

        // Create a map of symbol to price
        const priceMap: Record<string, number> = {};
        priceData.forEach((item: any) => {
            // Store both with and without suffix
            const symbol = item.symbol;
            const baseSymbol = symbol.replace('.NS', '').replace('.BO', '');
            priceMap[symbol] = item.regularMarketPrice;
            priceMap[baseSymbol] = item.regularMarketPrice;
        });

        // Update each stock with the current price
        for (const stock of stocks) {
            const price = priceMap[stock.symbol] ||
                priceMap[`${stock.symbol}.NS`] ||
                priceMap[`${stock.symbol}.BO`];
            if (price) {
                await supabaseService
                    .from('stocks')
                    .update({ current_price: price })
                    .eq('id', stock.id);
            }
        }

        // Fetch updated stocks
        const { data: updatedStocks } = await supabaseService
            .from('stocks')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });

        // Map to camelCase for frontend
        const mappedStocks = (updatedStocks || []).map(s => ({
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
            message: 'Prices updated successfully',
            stocks: mappedStocks,
            pricesUpdated: Object.keys(priceMap).length,
        }, { status: 200 });

    } catch (error: any) {
        console.error('Error fetching live prices:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch prices' }, { status: 500 });
    }
}

