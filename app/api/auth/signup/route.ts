import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';
import { signupSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = signupSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { fullName, email, password } = validation.data;

        // 1. Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        const user = authData.user;
        if (!user) {
            return NextResponse.json({ error: 'User creation failed' }, { status: 500 });
        }

        // Use service role to bypass RLS for initial setup
        const supabaseService = getServiceSupabase();

        // 2. Create Profile
        const { error: profileError } = await supabaseService
            .from('profiles')
            .upsert({ id: user.id, full_name: fullName });

        if (profileError) {
            console.error('Profile creation error:', profileError);
        }

        // 3. Seed default categories exactly as per the UI design
        const defaultCategories = [
            // Income
            { name: 'Salary', category_group: 'Income', is_default: true, user_id: user.id },
            { name: 'Freelancing', category_group: 'Income', is_default: true, user_id: user.id },
            { name: 'Investment Returns', category_group: 'Income', is_default: true, user_id: user.id },

            // Expense
            { name: 'Rent', category_group: 'Expense', is_default: true, user_id: user.id },
            { name: 'Groceries', category_group: 'Expense', is_default: true, user_id: user.id },
            { name: 'Utilities', category_group: 'Expense', is_default: true, user_id: user.id },
            { name: 'Entertainment', category_group: 'Expense', is_default: true, user_id: user.id },
            { name: 'Transportation', category_group: 'Expense', is_default: true, user_id: user.id },
            { name: 'Healthcare', category_group: 'Expense', is_default: true, user_id: user.id },
            { name: 'Insurance', category_group: 'Expense', is_default: true, user_id: user.id },
            { name: 'Investment Out', category_group: 'Expense', is_default: true, user_id: user.id },

            // Investment
            { name: 'Stocks', category_group: 'Investment', is_default: true, user_id: user.id },
            { name: 'Mutual Funds', category_group: 'Investment', is_default: true, user_id: user.id },
            { name: 'Real Estate', category_group: 'Investment', is_default: true, user_id: user.id },
            { name: 'Crypto', category_group: 'Investment', is_default: true, user_id: user.id },
            { name: 'Gold', category_group: 'Investment', is_default: true, user_id: user.id },
            { name: 'Bonds', category_group: 'Investment', is_default: true, user_id: user.id },
            { name: 'Fixed Deposits', category_group: 'Investment', is_default: true, user_id: user.id },
        ];

        const { error: categoryError } = await supabaseService
            .from('categories')
            .insert(defaultCategories);

        if (categoryError) {
            console.error('Category seeding error:', categoryError);
        }

        return NextResponse.json(
            { message: 'User created successfully. Please check your email if confirmation is enabled.' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
