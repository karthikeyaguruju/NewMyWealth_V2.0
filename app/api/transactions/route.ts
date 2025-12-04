// Transactions API routes
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { transactionSchema } from '@/lib/validations';

/** Extract userId from JWT token */
async function getUserId(request: NextRequest): Promise<string | null> {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    try {
        const decoded = await verifyToken(token);
        return decoded?.userId || null;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

/** GET /api/transactions – list with filters, sorting, pagination */
export async function GET(request: NextRequest) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const category = searchParams.get('category');
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');
        const minAmount = searchParams.get('minAmount');
        const maxAmount = searchParams.get('maxAmount');
        const description = searchParams.get('description'); // searches notes field
        const sortBy = searchParams.get('sortBy') || 'date';
        const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        // Build where clause with proper Date objects
        const where: any = { userId };
        if (type) where.type = type;
        if (category) where.category = category;
        if (startDateStr && endDateStr) {
            where.date = { gte: new Date(startDateStr), lte: new Date(endDateStr) };
        } else if (startDateStr) {
            where.date = { gte: new Date(startDateStr) };
        } else if (endDateStr) {
            where.date = { lte: new Date(endDateStr) };
        }
        if (minAmount) where.amount = { ...(where.amount || {}), gte: parseFloat(minAmount) };
        if (maxAmount) where.amount = { ...(where.amount || {}), lte: parseFloat(maxAmount) };
        if (description) where.notes = { contains: description, mode: 'insensitive' };

        // Order by handling
        const orderBy: any = {};
        if (sortBy === 'amount') orderBy.amount = order;
        else if (sortBy === 'category') orderBy.category = order;
        else if (sortBy === 'type') orderBy.type = order;
        else orderBy.date = order; // default

        const total = await prisma.transaction.count({ where });
        const transactions = await prisma.transaction.findMany({
            where,
            orderBy,
            skip,
            take: limit,
        });

        return NextResponse.json({
            transactions,
            pagination: { total, pages: Math.ceil(total / limit), page, limit },
        }, { status: 200 });
    } catch (error) {
        console.error('Get transactions error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/** POST /api/transactions – create a new transaction */
export async function POST(request: NextRequest) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
        const body = await request.json();
        const validatedData = transactionSchema.parse(body);

        // Convert date string (YYYY-MM-DD) to proper Date object
        // Parse the date parts to avoid timezone issues
        const [year, month, day] = validatedData.date.split('-').map(Number);
        const dateObject = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

        const transaction = await prisma.transaction.create({
            data: {
                userId,
                type: validatedData.type,
                categoryGroup: validatedData.categoryGroup,
                category: validatedData.category,
                subCategory: validatedData.subCategory,
                amount: validatedData.amount,
                date: dateObject,
                notes: validatedData.notes,
                categoryId: validatedData.categoryId,
            },
        });
        return NextResponse.json({ transaction }, { status: 201 });
    } catch (error: any) {
        console.error('Create transaction error:', error);
        if (error.name === 'ZodError') {
            return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
