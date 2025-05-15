
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Detailed checks for Supabase URL
if (!supabaseUrl || supabaseUrl.trim() === "") {
  throw new Error(
    "CRITICAL CONFIGURATION ERROR: NEXT_PUBLIC_SUPABASE_URL is not set or is empty in your .env file. Please provide your Supabase project URL. After editing .env, please restart your Next.js development server."
  );
}
// Check against common placeholder values
const urlPlaceholders = ["YOUR_SUPABASE_URL", "your_supabase_url_here"];
if (urlPlaceholders.includes(supabaseUrl)) {
  throw new Error(
    `CRITICAL CONFIGURATION ERROR: NEXT_PUBLIC_SUPABASE_URL in your .env file is still the placeholder '${supabaseUrl}'. You MUST replace this with your actual Supabase project URL. After editing .env, please restart your Next.js development server.`
  );
}

// Detailed checks for Supabase Anon Key
if (!supabaseAnonKey || supabaseAnonKey.trim() === "") {
  throw new Error(
    "CRITICAL CONFIGURATION ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or is empty in your .env file. Please provide your Supabase anon key. After editing .env, please restart your Next.js development server."
  );
}
// Check against common placeholder values
const keyPlaceholders = ["YOUR_SUPABASE_ANON_KEY", "your_supabase_anon_key_here"];
if (keyPlaceholders.includes(supabaseAnonKey)) {
  throw new Error(
    `CRITICAL CONFIGURATION ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file is still the placeholder '${supabaseAnonKey}'. You MUST replace this with your actual Supabase anon key. After editing .env, please restart your Next.js development server.`
  );
}

// Try to parse the URL to ensure it's well-formed before passing to Supabase client
try {
  new URL(supabaseUrl);
} catch (e) {
  throw new Error(
    `CRITICAL CONFIGURATION ERROR: The provided NEXT_PUBLIC_SUPABASE_URL ('${supabaseUrl}') is not a valid URL format. Please check it in your .env file. It should typically look like 'https://<your-project-ref>.supabase.co'. Parsing error: ${(e as Error).message}. After editing .env, please restart your Next.js development server.`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

