import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const rawKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured = 
  rawUrl && 
  rawUrl !== 'YOUR_SUPABASE_URL_HERE' && 
  rawKey && 
  rawKey !== 'YOUR_SUPABASE_ANON_KEY_HERE';

const supabaseUrl = isConfigured ? rawUrl! : 'https://dummy-placeholder-url.supabase.co';
const supabaseAnonKey = isConfigured ? rawKey! : 'dummy-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  }
});

if (!isConfigured) {
  console.warn("⚠️ Supabase environment variables are not configured in your .env file!");
}
