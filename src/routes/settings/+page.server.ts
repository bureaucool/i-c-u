import type { Actions, PageServerLoad } from './$types';
import { createSupabaseServer } from '$lib/server/supabase';
import { changePassword, createUserWithPassword } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	const supabase = createSupabaseServer(cookies);
	if (!locals.user) return { user: null } as any;

	// Groups current user belongs to
	const { data: memberships } = await supabase
		.from('group_member')
		.select('group_id')
		.eq('user_id', locals.user.id);
	const groupIds = (memberships ?? []).map((m: any) => m.group_id);
	const { data: groups } = groupIds.length
		? await supabase.from('group').select('id,title').in('id', groupIds)
		: ({ data: [] } as any);

	// All users (for selectors)
	const { data: users } = await supabase.from('user').select('*');

	// Current user info
	const { data: me } = await supabase
		.from('user')
		.select('*')
		.eq('id', locals.user.id)
		.maybeSingle();

	// Members of the active group
	let members: Array<{ id: number; name: string; email: string | null }> = [];
	if (locals.groupId) {
		const { data: memberIds } = await supabase
			.from('group_member')
			.select('user_id')
			.eq('group_id', locals.groupId);
		const ids = (memberIds ?? []).map((m: any) => m.user_id);
		const { data: usersOfGroup } = ids.length
			? await supabase.from('user').select('id,name,email').in('id', ids)
			: ({ data: [] } as any);
		members = usersOfGroup as any[] as any;
	}

	return {
		user: {
			...locals.user,
			availableTimeMinutesPerWeek: (me as any)?.available_time_minutes_per_week ?? null
		},
		groupId: locals.groupId,
		groups: groups ?? [],
		users: users ?? [],
		members
	} as any;
};

export const actions: Actions = {
	updateGroup: async ({ request, locals, cookies }) => {
		const supabase = createSupabaseServer(cookies);
		if (!locals.user) return fail(401, { message: 'unauthorized' });
		const form = await request.formData();
		const id = Number(form.get('groupId'));
		const title = String(form.get('title') ?? '').trim();
		if (!Number.isFinite(id) || !title) return fail(400, { message: 'invalid' });
		const { error } = await supabase.from('group').update({ title }).eq('id', id);
		if (error) return fail(500, { message: error.message });
		return { ok: true };
	},
	selectGroup: async ({ request, locals, cookies }) => {
		const supabase = createSupabaseServer(cookies);
		if (!locals.user) return fail(401, { message: 'unauthorized' });
		const form = await request.formData();
		const id = Number(form.get('groupId'));
		if (!Number.isFinite(id)) return fail(400, { message: 'invalid' });
		// ensure membership
		const { data: m } = await supabase
			.from('group_member')
			.select('user_id')
			.eq('group_id', id)
			.eq('user_id', locals.user.id)
			.maybeSingle();
		if (!m) return fail(403, { message: 'not a member' });
		cookies.set('gid', String(id), { path: '/', sameSite: 'lax' });
		return { ok: true };
	},
	updateAvailability: async ({ request, locals, cookies }) => {
		const supabase = createSupabaseServer(cookies);
		if (!locals.user) return fail(401, { message: 'unauthorized' });
		const form = await request.formData();
		const id = Number(form.get('userId'));
		const minutes = Number(form.get('availableTimeMinutesPerWeek'));
		if (!Number.isFinite(id) || !Number.isFinite(minutes)) return fail(400, { message: 'invalid' });
		const { error } = await supabase
			.from('user')
			.update({ available_time_minutes_per_week: minutes })
			.eq('id', id);
		if (error) return fail(500, { message: error.message });
		return { ok: true };
	},
	changePassword: async ({ request, locals, cookies }) => {
		if (!locals.user) return fail(401, { message: 'unauthorized' });
		const form = await request.formData();
		const newPassword = String(form.get('newPassword') ?? '');
		if (!newPassword) return fail(400, { message: 'invalid' });
		await changePassword(locals.user.id, newPassword, cookies);
		return { ok: true };
	},
	addMember: async ({ request, locals, cookies }) => {
		const supabase = createSupabaseServer(cookies);
		if (!locals.user) return fail(401, { message: 'unauthorized' });
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		const name = String((form.get('name') ?? '').toString().trim() || email.split('@')[0] || '');
		const password = String(form.get('password') ?? '');
		const groupId = locals.groupId;
		if (!email || !password || !Number.isFinite(groupId)) return fail(400, { message: 'invalid' });

		// Create user if not exists
		let { data: u } = await supabase.from('user').select('*').eq('email', email).maybeSingle();
		if (!u) {
			u = (await createUserWithPassword(name, email, password, cookies)) as any;
		} else {
			// ensure has password
			if (!(u as any).password_hash) {
				await changePassword((u as any).id, password, cookies);
			}
		}

		// add membership if not present
		const { data: m } = await supabase
			.from('group_member')
			.select('user_id')
			.eq('group_id', groupId as number)
			.eq('user_id', (u as any).id)
			.maybeSingle();
		if (!m) {
			const { error: gmErr } = await supabase
				.from('group_member')
				.insert({ group_id: groupId as number, user_id: (u as any).id });
			if (gmErr) return fail(500, { message: gmErr.message });
		}
		return { ok: true };
	},
	removeMember: async ({ request, locals, cookies }) => {
		const supabase = createSupabaseServer(cookies);
		if (!locals.user) return fail(401, { message: 'unauthorized' });
		const form = await request.formData();
		const userId = Number(form.get('userId'));
		const groupId = locals.groupId;
		if (!Number.isFinite(userId) || !Number.isFinite(groupId))
			return fail(400, { message: 'invalid' });

		const { error } = await supabase
			.from('group_member')
			.delete()
			.eq('group_id', groupId as number)
			.eq('user_id', userId);
		if (error) return fail(500, { message: error.message });
		return { ok: true };
	}
};
