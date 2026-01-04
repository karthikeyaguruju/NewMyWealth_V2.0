import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { stockSchema } from '@/lib/validations';

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

export async function GET(request: NextRequest) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const page = searchParams.get('page');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search');
        const type = searchParams.get('type');

        // Build where clause
        const where: any = { userId };

        if (search) {
            where.OR = [
                { symbol: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (type && type !== 'all') {
            where.type = type.toUpperCase();
        }

        let stocks;
        let total = 0;
        let pages = 1;

        if (page) {
            const pageNum = parseInt(page);
            const skip = (pageNum - 1) * limit;

            const [pagedStocks, count] = await Promise.all([
                prisma.stock.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma.stock.count({
                    where,
                })
            ]);
            stocks = pagedStocks;
            total = count;
            pages = Math.ceil(total / limit);
        } else {
            stocks = await prisma.stock.findMany({
                where,
                orderBy: { createdAt: 'desc' },
            });
            total = stocks.length;
        }

        return NextResponse.json({
            stocks,
            pagination: {
                total,
                pages,
                currentPage: page ? parseInt(page) : 1,
                limit
            }
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = stockSchema.parse(body);
        const { date, ...dataWithoutDate } = validatedData;

        // Always save as a new transaction record - no merging
        // This preserves full transaction history for the user
        const stock = await prisma.stock.create({
            data: {
                ...dataWithoutDate,
                date: date ? new Date(date) : new Date(),
                symbol: validatedData.symbol.toUpperCase(),
                userId,
                totalValue: validatedData.quantity * validatedData.buyPrice,
            },
        });

        return NextResponse.json({ stock, averaged: false }, { status: 201 });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
        }
        console.error('Stock creation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
