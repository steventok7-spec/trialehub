import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Verify required environment variables
const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OWNER_EMAIL',
    'OWNER_PASSWORD',
];

for (const key of required) {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
}

console.log('✓ Integration test environment configured');
