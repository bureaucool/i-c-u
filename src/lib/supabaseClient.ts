import { createClient } from '@supabase/supabase-js';
import {
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_ANON_KEY,
	PUBLIC_SUPABASE_PUBLISHABLE_KEY
} from '$env/static/public';

export function createSupabaseBrowser() {
	const publicKey = PUBLIC_SUPABASE_PUBLISHABLE_KEY || PUBLIC_SUPABASE_ANON_KEY;
	if (!PUBLIC_SUPABASE_URL || !publicKey) throw new Error('Supabase env vars missing');
	return createClient(PUBLIC_SUPABASE_URL, publicKey, {
		auth: {
			persistSession: true,
			autoRefreshToken: true
		}
	});
}
