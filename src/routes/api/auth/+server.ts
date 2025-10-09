import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const email = typeof body.email === 'string' ? body.email.trim() : '';
	const password = typeof body.password === 'string' ? body.password : '';
	if (!email || !password) throw error(400, 'email and password required');

	const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			get: (key) => cookies.get(key),
			set: (key, value, options) => cookies.set(key, value, { path: '/', ...options }),
			remove: (key, options) => cookies.delete(key, { path: '/', ...options })
		}
	});

	const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
	if (authErr || !data.user) throw error(401, authErr?.message || 'invalid credentials');

	// create local user row if missing
	const { data: existing } = await supabase
		.from('user')
		.select('*')
		.eq('email', email)
		.maybeSingle();
	if (!existing) {
		await supabase.from('user').insert({ name: email.split('@')[0] || email, email });
	}

	// If user has exactly one group, set it as active
	try {
		const { data: u } = await supabase.from('user').select('*').eq('email', email).maybeSingle();
		if (u) {
			const { data: groups } = await supabase
				.from('group_member')
				.select('group_id')
				.eq('user_id', (u as any).id);
			if ((groups ?? []).length === 1) {
				cookies.set('gid', String((groups as any)[0].group_id), { path: '/', sameSite: 'lax' });
			}
		}
	} catch {}
	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ cookies }) => {
	const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			get: (key) => cookies.get(key),
			set: (key, value, options) => cookies.set(key, value, { path: '/', ...options }),
			remove: (key, options) => cookies.delete(key, { path: '/', ...options })
		}
	});
	await supabase.auth.signOut();
	return json({ ok: true });
};
