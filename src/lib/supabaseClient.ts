import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

let supabaseInstance: SupabaseClient | null = null;

export function createSupabaseBrowser(forceNew: boolean = false) {
	// Return singleton instance for consistent realtime connections
	if (supabaseInstance && !forceNew) return supabaseInstance;

	const publicKey = PUBLIC_SUPABASE_ANON_KEY;
	if (!PUBLIC_SUPABASE_URL || !publicKey) throw new Error('Supabase env vars missing');

	// Use @supabase/ssr browser client which properly handles auth cookies
	supabaseInstance = createBrowserClient(PUBLIC_SUPABASE_URL, publicKey);

	return supabaseInstance;
}

// Reset the singleton instance (useful after login/logout to pick up new session)
export function resetSupabaseBrowser() {
	supabaseInstance = null;
}
