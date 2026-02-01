import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client using environment variables.
// Use NEXT_PUBLIC_* for values that must be available to the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (process.env.NODE_ENV === 'development') {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
}

// Create a function to get the Supabase client
// This ensures the client is only created when actually needed
export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Create an authenticated Supabase client with user's JWT token
// This is needed for server-side operations that require RLS auth
export function getAuthenticatedSupabaseClient(accessToken: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured');
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  });
}

// For backward compatibility, also export the client directly
// But only create it if environment variables are available
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
