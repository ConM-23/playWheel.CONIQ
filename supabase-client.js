import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// The publishable key is the PUBLIC key — safe to expose in client-side
// code, because Row Level Security (already set up on your tables) is
// what actually protects the data. Never put the secret key here.
const SUPABASE_URL = 'https://nhvpmhyvismtpanwdhde.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_nXVGs29Hb9gRD6DgCwzWmg_9gUV0zpD';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);