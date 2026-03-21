import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !key) {
  throw new Error(
    'Supabase miljövariabler saknas. Kontrollera att VITE_SUPABASE_URL och VITE_SUPABASE_ANON_KEY är satta i Netlify → Site configuration → Environment variables.'
  );
}

export const supabase = createClient(url, key);
