// Supabase client — uses the service role key so the API bypasses RLS.
// Never expose this key to a browser or frontend.
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import config from '../config/index.js';

const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    transport: ws,
  },
});

export default supabase;
