import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || supabaseUrl === 'https://your-project-id.supabase.co') {
  throw new Error(
    'Missing VITE_SUPABASE_URL environment variable. Please set up your Supabase project URL in the .env file.\n' +
    'See SETUP_SUPABASE.md for instructions.'
  );
}

if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY environment variable. Please set up your Supabase anon key in the .env file.\n' +
    'See SETUP_SUPABASE.md for instructions.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Types for user authentication
export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

// Types for user authentication
export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}