import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xdcinluqebryaucihpbx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkY2lubHVxZWJyeWF1Y2locGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMTMxMTQsImV4cCI6MjA2NjU4OTExNH0.pMw2SOPcmfwEZUbiFvr9kKEZCVotyVAYLUCmvfFaR7o';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);