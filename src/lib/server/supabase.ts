import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Cookies } from '@sveltejs/kit';

export function createSupabaseServer(cookies: Cookies) {
	const publicKey = PUBLIC_SUPABASE_ANON_KEY;
	return createServerClient(PUBLIC_SUPABASE_URL, publicKey, {
		cookies: {
			get: (key: string) => cookies.get(key),
			set: (key: string, value: string, options: CookieOptions) =>
				cookies.set(key, value, { path: '/', ...options }),
			remove: (key: string, options: CookieOptions) =>
				cookies.delete(key, { path: '/', ...options })
		}
	});
}
