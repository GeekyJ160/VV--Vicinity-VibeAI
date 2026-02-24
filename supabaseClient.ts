
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only initialize if both values are present to avoid "supabaseUrl is required" error
export const supabase: SupabaseClient = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as unknown as SupabaseClient;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
