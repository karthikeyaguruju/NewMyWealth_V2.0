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

        const stocks = await prisma.stock.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ stocks }, { status: 200 });
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

        // Check if stock with same symbol already exists for this user
        const existingStock = await prisma.stock.findFirst({
            where: {
                userId,
                symbol: validatedData.symbol.toUpperCase(),
            },
        });

        if (existingStock) {
            // Calculate weighted average buy price
            // Formula: (oldQty * oldPrice + newQty * newPrice) / (oldQty + newQty)
            const oldQty = existingStock.quantity;
            const oldPrice = existingStock.buyPrice;
            const newQty = validatedData.quantity;
            const newPrice = validatedData.buyPrice;

            const totalQty = oldQty + newQty;
            const totalInvested = (oldQty * oldPrice) + (newQty * newPrice);
            const averagePrice = totalInvested / totalQty;

            // Update the existing stock entry
            const updatedStock = await prisma.stock.update({
                where: { id: existingStock.id },
                data: {
                    quantity: totalQty,
                    buyPrice: averagePrice,
                    totalValue: totalInvested,
                    // Keep the name updated if provided
                    name: validatedData.name || existingStock.name,
                },
            });

            return NextResponse.json({
                stock: updatedStock,
                message: `Stock averaged: ${totalQty} shares at ₹${averagePrice.toFixed(2)} average price`,
                averaged: true
            }, { status: 200 });
        }

        // Create new stock entry if symbol doesn't exist
        const stock = await prisma.stock.create({
            data: {
                ...validatedData,
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
