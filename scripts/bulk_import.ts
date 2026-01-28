
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// --- Configuration ---
// Read config from the existing file if possible, or hardcode for the script context
// Since we are in a script, we need to manually read the file or just use the known values.
// For robustness in this environment, I will read the values from src/supabase.config.ts logic
// effectively by copying the values found in previous steps.

const SUPABASE_URL = 'https://zzvusbrlfullsglomqbs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dnVzYnJsZnVsbHNnbG9tcWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNzg2NTUsImV4cCI6MjA4NDc1NDY1NX0.9sgfdhq9Y9iYB_2LOF0_MiHQ1cvQmndgE9c8813x1BQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CSV_FILE_PATH = path.join(__dirname, '../employees_to_import.csv');

// --- Types ---
interface EmployeeCSVRow {
    email: string;
    password?: string;
    name: string;
    role: string;
    job_title: string;
    employment_type: string;
    status: string;
    monthly_salary_idr: string; // CSV reads as string
    hourly_rate_idr: string;
    phone_number: string;
    date_of_birth: string;
    gender: string;
    start_date: string;
    address: string;
    national_id: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    bank_name: string;
    bank_account_number: string;
}

// --- CSV Parser (Simple) ---
function parseCSV(content: string): EmployeeCSVRow[] {
    const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map((h) => h.trim());
    const data: EmployeeCSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
        // Handle simple comma separation (doesn't handle quoted commas, but sufficient for this template)
        const values = lines[i].split(',').map((v) => v.trim());

        if (values.length !== headers.length) {
            console.warn(`Skipping line ${i + 1}: Column count mismatch.`);
            continue;
        }

        const row: any = {};
        headers.forEach((header, index) => {
            row[header] = values[index];
        });
        data.push(row as EmployeeCSVRow);
    }
    return data;
}

// --- Main ---
async function main() {
    console.log('--- Starting Bulk Employee Import ---');

    if (!fs.existsSync(CSV_FILE_PATH)) {
        console.error(`Error: File not found at ${CSV_FILE_PATH}`);
        process.exit(1);
    }

    const content = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
    const employees = parseCSV(content);

    console.log(`Found ${employees.length} employees to import.`);

    for (const emp of employees) {
        console.log(`\nImporting: ${emp.name} (${emp.email})...`);

        // 1. Create Auth User
        // Note: We use a fresh client or just strict checks. 
        // Since we are using the detailed 'signUp' with specific password, this creates the user.
        // If user already exists, it might sign them in or error depending on config.
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: emp.email,
            password: emp.password || '123456', // Default password if missing
            options: {
                data: { name: emp.name }, // Stored in raw_user_meta_data
            },
        });

        if (authError) {
            console.error(`  [FAILED] Auth Creation: ${authError.message}`);
            continue;
        }

        if (!authData.user) {
            console.error(`  [FAILED] No user returned.`);
            continue;
        }

        const userId = authData.user.id;
        console.log(`  [OK] User created (ID: ${userId})`);

        // 2. Update Public Profile
        // The trigger might have created the profile already with basic info.
        // We update it to ensure all fields are correct.
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                job_title: emp.job_title,
                employment_type: emp.employment_type,
                status: emp.status || 'active',
                phone_number: emp.phone_number,
                date_of_birth: emp.date_of_birth || null,
                gender: emp.gender || null,
                start_date: emp.start_date || null,
                role: emp.role || 'employee',
            })
            .eq('id', userId);

        if (profileError) {
            console.error(`  [FAILED] Profile Update: ${profileError.message}`);
        } else {
            console.log(`  [OK] Profile updated.`);
        }

        // 3. Update Private Details
        // The trigger created the row, we update it.
        const { error: detailsError } = await supabase
            .from('private_details')
            .update({
                monthly_salary_idr: parseFloat(emp.monthly_salary_idr) || 0,
                hourly_rate_idr: parseFloat(emp.hourly_rate_idr) || 0,
                address: emp.address,
                national_id: emp.national_id,
                emergency_contact_name: emp.emergency_contact_name,
                emergency_contact_phone: emp.emergency_contact_phone,
                bank_name: emp.bank_name,
                bank_account_number: emp.bank_account_number,
            })
            .eq('id', userId);

        if (detailsError) {
            console.error(`  [FAILED] Private Details Update: ${detailsError.message}`);
        } else {
            console.log(`  [OK] Private Details updated.`);
        }
    }

    console.log('\n--- Import Complete ---');
}

main().catch(console.error);
