import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '0b660c484dmsh36da1690e37f3a2p19a993jsn9f650c04dd24';
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'yahoo-finance15.p.rapidapi.com';

async function getUserId(request: NextRequest): Promise<string | null> {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    try {
        const decoded = await verifyToken(token);
        return decoded?.userId || null;
    } catch (error) {
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Get all user's stocks
        const stocks = await prisma.stock.findMany({
            where: { userId },
            select: { id: true, symbol: true },
        });

        if (stocks.length === 0) {
            return NextResponse.json({ message: 'No stocks to update' }, { status: 200 });
        }

        // Format symbols for Indian stocks (add .NS for NSE)
        const symbols = stocks.map(s => {
            // If symbol doesn't have exchange suffix, add .NS for NSE
            if (!s.symbol.includes('.')) {
                return `${s.symbol}.NS`;
            }
            return s.symbol;
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
        const updatePromises = stocks.map(async (stock) => {
            const price = priceMap[stock.symbol] || priceMap[`${stock.symbol}.NS`];
            if (price) {
                return prisma.stock.update({
                    where: { id: stock.id },
                    data: { currentPrice: price },
                });
            }
            return null;
        });

        await Promise.all(updatePromises);

        // Fetch updated stocks
        const updatedStocks = await prisma.stock.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            message: 'Prices updated successfully',
            stocks: updatedStocks,
            pricesUpdated: Object.keys(priceMap).length,
        }, { status: 200 });

    } catch (error: any) {
        console.error('Error fetching live prices:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch prices' }, { status: 500 });
    }
}
