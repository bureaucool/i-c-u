import type { Handle } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const handle: Handle = async ({ event, resolve }) => {
	// Supabase SSR client for auth cookies handling
	const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			get: (key) => event.cookies.get(key),
			set: (key, value, options) => event.cookies.set(key, value, { path: '/', ...options }),
			remove: (key, options) => event.cookies.delete(key, { path: '/', ...options })
		}
	});

	const {
		data: { user: sbUser }
	} = await supabase.auth.getUser();

	let currentUser: { id: number; name: string; email: string } | null = null;
	let currentGroupId: number | null = null;
	if (sbUser) {
		// Prefer mapping by auth_user_id (uuid)
		let { data: u } = await supabase
			.from('user')
			.select('*')
			.eq('auth_user_id', sbUser.id)
			.maybeSingle();
		// Fallback by email, then backfill mapping
		if (!u && sbUser.email) {
			const res = await supabase.from('user').select('*').eq('email', sbUser.email).maybeSingle();
			u = res.data as any;
			if (u && !u.auth_user_id) {
				await supabase.from('user').update({ auth_user_id: sbUser.id }).eq('id', u.id);
			}
		}
		if (u)
			currentUser = { id: (u as any).id, name: (u as any).name, email: (u as any).email } as any;
	}

	// choose group from cookie if valid membership; otherwise default to first membership
	const gid = event.cookies.get('gid');
	if (gid && /^\d+$/.test(gid) && currentUser) {
		const groupIdNum = Number(gid);
		const { data: membership } = await supabase
			.from('group_member')
			.select('user_id')
			.eq('group_id', groupIdNum)
			.eq('user_id', currentUser.id)
			.maybeSingle();
		if (membership) {
			currentGroupId = groupIdNum;
		} else {
			// stale cookie: clear it
			event.cookies.delete('gid', { path: '/' });
		}
	} else if (currentUser) {
		const { data: memberships } = await supabase
			.from('group_member')
			.select('group_id')
			.eq('user_id', currentUser.id);
		if ((memberships ?? []).length > 0) {
			currentGroupId = (memberships as any)[0].group_id as number;
			// persist cookie so subsequent requests are consistent
			event.cookies.set('gid', String(currentGroupId), { path: '/', sameSite: 'lax' });
		}
	}

	event.locals.user = currentUser;
	event.locals.groupId = currentGroupId;

	// Enforce auth on API routes except auth endpoint
	if (event.url.pathname.startsWith('/api') && !event.url.pathname.startsWith('/api/auth')) {
		if (!event.locals.user) {
			return new Response(JSON.stringify({ error: 'unauthorized' }), {
				status: 401,
				headers: { 'content-type': 'application/json' }
			});
		}
	}

	return resolve(event);
};
