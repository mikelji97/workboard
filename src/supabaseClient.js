import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  || 'https://nmykvrxkmtshqhtenits.supabase.co'
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON || 'sb_publishable_zRl8VLMonzbLgH35gVt6yg_4jHNgucD'

export const supabase = createClient(supabaseUrl, supabaseAnon)
