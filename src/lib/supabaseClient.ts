import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

let supabaseInstance: SupabaseClient | null = null;

export function createSupabaseBrowser() {
	// Return singleton instance for consistent realtime connections
	if (supabaseInstance) return supabaseInstance;

	const publicKey = PUBLIC_SUPABASE_ANON_KEY;
	if (!PUBLIC_SUPABASE_URL || !publicKey) throw new Error('Supabase env vars missing');

	// Use @supabase/ssr browser client which properly handles auth cookies
	supabaseInstance = createBrowserClient(PUBLIC_SUPABASE_URL, publicKey);

	return supabaseInstance;
}
