import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';

// Helper to get user via Supabase token
async function getUser(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
}

// GET /api/user/profile - Get user profile
export async function GET(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                fullName: profile?.full_name || user.user_metadata?.full_name || 'User',
                createdAt: user.created_at,
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/user/profile - Update user profile and settings
export async function PUT(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { fullName } = body;

        const { data: updatedProfile, error: profileError } = await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', user.id)
            .select()
            .single();

        if (profileError) throw profileError;

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                fullName: updatedProfile.full_name,
                createdAt: user.created_at,
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/user/profile - Delete user account
export async function DELETE(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const supabaseService = getServiceSupabase();
        const { error } = await supabaseService.auth.admin.deleteUser(user.id);

        if (error) throw error;

        const response = NextResponse.json({ message: 'Account deleted successfully' });
        response.cookies.delete('token');
        return response;
    } catch (error) {
        console.error('Delete account error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
