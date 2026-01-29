import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ewquycutqbtagjlokvyn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3cXV5Y3V0cWJ0YWdqbG9rdnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MTI3MjYsImV4cCI6MjA4NTE4ODcyNn0.FhdCAcK7nxIUk7zdoqxX9xyrjCslBUPXRBiWgugXu3s'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
