import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { PUBLIC_APP_URL } from '$env/static/public';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const email = typeof body.email === 'string' ? body.email.trim() : '';
	const password = typeof body.password === 'string' ? body.password : '';
	const name = typeof (body as any).name === 'string' ? ((body as any).name as string).trim() : '';
	if (!email || !password) throw error(400, 'email and password required');

	const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			get: (key) => cookies.get(key),
			set: (key, value, options) => cookies.set(key, value, { path: '/', ...options }),
			remove: (key, options) => cookies.delete(key, { path: '/', ...options })
		}
	});

	const appBase = PUBLIC_APP_URL || 'http://localhost:5173';
	const redirectTo = `${appBase}/auth/confirmed`;
	const { data, error: authErr } = await supabase.auth.signUp({
		email,
		password,
		options: { data: { name }, emailRedirectTo: redirectTo }
	});
	if (authErr || !data.user) throw error(400, authErr?.message || 'sign up failed');

	// ensure local user row exists
	const { data: existing } = await supabase
		.from('user')
		.select('*')
		.eq('email', email)
		.maybeSingle();
	if (!existing) {
		await supabase.from('user').insert({ name: name || email.split('@')[0] || email, email });
	}

	return json({ ok: true });
};
