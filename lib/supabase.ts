import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This is the standard client for frontend and regular backend queries.
// It respects Row-Level Security (RLS).
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Cached service role client for backend-only tasks that need to bypass RLS.
 * Uses singleton pattern for better performance.
 */
let serviceSupabase: SupabaseClient | null = null;

export const getServiceSupabase = (): SupabaseClient => {
    if (serviceSupabase) return serviceSupabase;

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');
    }
    serviceSupabase = createClient(supabaseUrl, serviceRoleKey);
    return serviceSupabase;
};

