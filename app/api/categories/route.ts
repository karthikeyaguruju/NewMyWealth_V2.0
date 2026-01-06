import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';

// Helper to get user from token
async function getUser(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
}

// GET /api/categories - Get all categories for user
export async function GET(request: NextRequest) {
    try {
        const user = await getUser(request);

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const categoryGroup = searchParams.get('categoryGroup');

        // Use service role to bypass RLS for reads
        const supabaseService = getServiceSupabase();

        let query = supabaseService
            .from('categories')
            .select('*')
            .eq('user_id', user.id);

        if (categoryGroup) {
            query = query.eq('category_group', categoryGroup);
        }

        const { data: categories, error } = await query
            .order('is_default', { ascending: false })
            .order('name', { ascending: true });

        if (error) throw error;

        // Map fields for frontend
        const mappedCategories = (categories || []).map(cat => ({
            ...cat,
            categoryGroup: cat.category_group,
            isDefault: cat.is_default
        }));

        return NextResponse.json({ categories: mappedCategories }, { status: 200 });
    } catch (error) {
        console.error('Get categories error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
    try {
        const user = await getUser(request);

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        let { categoryGroup, name } = body;

        if (!categoryGroup || !name) {
            return NextResponse.json(
                { error: 'Category group and name are required' },
                { status: 400 }
            );
        }

        // Normalize capitalization for database check constraint
        const normalizedGroup = categoryGroup.charAt(0).toUpperCase() + categoryGroup.slice(1).toLowerCase();
        const validGroups = ['Income', 'Expense', 'Investment'];
        const finalGroup = validGroups.includes(normalizedGroup) ? normalizedGroup : categoryGroup;

        // Use service role to bypass RLS (user is already authenticated)
        const supabaseService = getServiceSupabase();

        const { data: category, error } = await supabaseService
            .from('categories')
            .insert({
                user_id: user.id,
                category_group: finalGroup,
                name: name,
                is_default: false,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            category: {
                ...category,
                categoryGroup: category.category_group,
                isDefault: category.is_default
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Create category error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
