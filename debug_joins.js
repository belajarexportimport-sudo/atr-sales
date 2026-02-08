
import { createClient } from '@supabase/supabase-js';

// Config from src/lib/supabase.js
const supabaseUrl = 'https://ewquycutqbtagjlokvyn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3cXV5Y3V0cWJ0YWdqbG9rdnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MTI3MjYsImV4cCI6MjA4NTE4ODcyNn0.FhdCAcK7nxIUk7zdoqxX9xyrjCslBUPXRBiWgugXu3s'

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuery(label, queryFunc) {
    console.log(`\n--- Testing: ${label} ---`);
    const { data, error } = await queryFunc();
    if (error) {
        console.error('❌ ERROR:', error.message);
        if (error.details) console.error('   Details:', error.details);
        if (error.hint) console.error('   Hint:', error.hint);
    } else {
        console.log('✅ SUCCESS! Rows:', data.length);
        if (data.length > 0) {
            const sample = data[0];
            console.log('   Sample:', JSON.stringify(sample, null, 2));
            if (sample.profiles && sample.profiles.full_name) {
                console.log('   🎯 JOIN WORKED! Sales Rep:', sample.profiles.full_name);
            } else {
                console.log('   ⚠️ Join returned null/empty profile');
            }
        }
    }
}

async function runTests() {
    // Test 1: Explicit Constraint Name (Current Frontend Code)
    await testQuery('Constraint Name: profiles!inquiries_user_id_fkey', () =>
        supabase.from('inquiries')
            .select('id, profiles!inquiries_user_id_fkey(full_name)')
            .limit(1)
    );

    // Test 2: Column Hint
    await testQuery('Column Hint: profiles!user_id', () =>
        supabase.from('inquiries')
            .select('id, profiles!user_id(full_name)')
            .limit(1)
    );
}

runTests();
