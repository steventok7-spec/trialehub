
import { createClient } from '@supabase/supabase-js';

// ====================================================================
// SUPABASE CONFIGURATION
// ====================================================================
// 1. Go to https://supabase.com/dashboard and create a new project.
// 2. Go to Project Settings -> API.
// 3. Copy the "Project URL" and paste it into SUPABASE_URL below.
// 4. Copy the "anon" / "public" key and paste it into SUPABASE_ANON_KEY below.
//    (The key should start with 'ey...' and is a long JWT string)
// ====================================================================

export const SUPABASE_URL = 'https://zzvusbrlfullsglomqbs.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dnVzYnJsZnVsbHNnbG9tcWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNzg2NTUsImV4cCI6MjA4NDc1NDY1NX0.9sgfdhq9Y9iYB_2LOF0_MiHQ1cvQmndgE9c8813x1BQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
