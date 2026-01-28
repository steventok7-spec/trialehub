import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing required environment variables. Check .env file.');
}

/**
 * Supabase client with anon key (user-level permissions)
 */
export function clientAnon(): SupabaseClient {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/**
 * Supabase client with service role key (bypasses RLS)
 */
export function clientService(): SupabaseClient {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

export interface TestEmployee {
    id: string;
    email: string;
    password: string;
    name: string;
    role: 'employee';
}

/**
 * Create a test employee with auth user + profile + private_details
 */
export async function createTestEmployee(
    email: string,
    password: string,
    profileOverrides: Partial<{
        name: string;
        job_title: string;
        employment_type: string;
        monthly_salary_idr: number;
        hourly_rate_idr: number;
    }> = {}
): Promise<TestEmployee> {
    const service = clientService();

    // 1. Create auth user
    const { data: authData, error: authError } = await service.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });

    if (authError || !authData.user) {
        throw new Error(`Failed to create auth user: ${authError?.message}`);
    }

    const userId = authData.user.id;

    // 2. Update profile (created by trigger)
    const { error: profileError } = await service
        .from('profiles')
        .update({
            name: profileOverrides.name || 'Test Employee',
            role: 'employee',
            status: 'active',
            job_title: profileOverrides.job_title || 'barista',
            employment_type: profileOverrides.employment_type || 'full_time',
        })
        .eq('id', userId);

    if (profileError) {
        throw new Error(`Failed to update profile: ${profileError.message}`);
    }

    // 3. Update private_details (created by trigger)
    const { error: detailsError } = await service
        .from('private_details')
        .update({
            monthly_salary_idr: profileOverrides.monthly_salary_idr || 5000000,
            hourly_rate_idr: profileOverrides.hourly_rate_idr || null,
        })
        .eq('id', userId);

    if (detailsError) {
        throw new Error(`Failed to update private_details: ${detailsError.message}`);
    }

    return {
        id: userId,
        email,
        password,
        name: profileOverrides.name || 'Test Employee',
        role: 'employee',
    };
}

/**
 * Ensure a user has owner role
 */
export async function ensureOwnerRole(email: string): Promise<void> {
    const service = clientService();

    const { error } = await service
        .from('profiles')
        .update({ role: 'owner' })
        .eq('email', email);

    if (error) {
        throw new Error(`Failed to set owner role: ${error.message}`);
    }
}

/**
 * Delete all test users (emails starting with 'test-')
 */
export async function cleanupTestUsers(): Promise<void> {
    const service = clientService();

    // Get all test users
    const { data: profiles, error: fetchError } = await service
        .from('profiles')
        .select('id, email')
        .like('email', 'test-%');

    if (fetchError) {
        console.error('Failed to fetch test users:', fetchError);
        return;
    }

    if (!profiles || profiles.length === 0) {
        return;
    }

    // Delete auth users (cascades to profiles and private_details)
    for (const profile of profiles) {
        try {
            await service.auth.admin.deleteUser(profile.id);
            console.log(`Deleted test user: ${profile.email}`);
        } catch (err) {
            console.error(`Failed to delete ${profile.email}:`, err);
        }
    }
}

/**
 * Delete test data from a table
 */
export async function cleanupTestData(
    table: string,
    condition: { column: string; value: any }
): Promise<void> {
    const service = clientService();

    const { error } = await service
        .from(table)
        .delete()
        .eq(condition.column, condition.value);

    if (error) {
        console.error(`Failed to cleanup ${table}:`, error);
    }
}

/**
 * Assert that a Supabase operation affected at least N rows
 */
export function assertRowsAffected(
    result: { data: any; error: any },
    min: number = 1
): void {
    if (result.error) {
        throw new Error(`Operation failed: ${result.error.message}`);
    }

    const rowCount = Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0;

    if (rowCount < min) {
        throw new Error(`Expected at least ${min} rows affected, got ${rowCount}`);
    }
}

/**
 * Sign in as a user and return the session
 */
export async function signInAsUser(email: string, password: string) {
    const client = clientAnon();

    const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
    });

    if (error || !data.session) {
        throw new Error(`Failed to sign in: ${error?.message}`);
    }

    return data.session;
}

/**
 * Get authenticated client for a specific user
 */
export async function getAuthenticatedClient(email: string, password: string): Promise<SupabaseClient> {
    const session = await signInAsUser(email, password);

    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
            headers: {
                Authorization: `Bearer ${session.access_token}`,
            },
        },
    });
}
