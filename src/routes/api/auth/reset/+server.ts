import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, PUBLIC_APP_URL } from '$env/static/public';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const email = typeof body.email === 'string' ? body.email.trim() : '';
	if (!email) throw error(400, 'email required');

	const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			get: (key) => cookies.get(key),
			set: (key, value, options) => cookies.set(key, value, { path: '/', ...options }),
			remove: (key, options) => cookies.delete(key, { path: '/', ...options })
		}
	});

	const appBase = PUBLIC_APP_URL || 'http://localhost:5173';
	const redirectTo = `${appBase}/auth/reset`;

	const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo
	});
	if (err) throw error(400, err.message || 'failed to send reset email');
	return json({ ok: true });
};
