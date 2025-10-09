import type { Actions, PageServerLoad } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { createSupabaseServer } from '$lib/server/supabase';

const ADMIN_EMAIL = 'mail@benw.de';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	const supabase = createSupabaseServer(cookies);
	if (!locals.user || locals.user.email !== ADMIN_EMAIL) throw redirect(302, '/');

	const { data: groups } = await supabase.from('group').select('*');
	// Members by group
	const membersByGroup: Record<number, Array<{ id: number; name: string; email: string }>> = {};
	for (const g of groups ?? []) {
		const { data: memberIds } = await supabase
			.from('group_member')
			.select('user_id')
			.eq('group_id', g.id);
		const ids = (memberIds ?? []).map((m: any) => m.user_id);
		const { data: users } = ids.length
			? await supabase.from('user').select('id,name,email').in('id', ids)
			: ({ data: [] } as any);
		membersByGroup[g.id] = users as any[] as any;
	}
	return { groups: groups ?? [], membersByGroup };
};

export const actions: Actions = {
	createGroup: async ({ request, locals, cookies }) => {
		const supabase = createSupabaseServer(cookies);
		if (!locals.user || locals.user.email !== ADMIN_EMAIL)
			return fail(401, { message: 'unauthorized' });
		const form = await request.formData();
		const title = String(form.get('title') ?? '').trim();
		if (!title) return fail(400, { message: 'invalid' });
		const { error } = await supabase.from('group').insert({ title });
		if (error) return fail(500, { message: error.message });
		return { ok: true };
	},
	addMember: async ({ request, locals, cookies }) => {
		const supabase = createSupabaseServer(cookies);
		if (!locals.user || locals.user.email !== ADMIN_EMAIL)
			return fail(401, { message: 'unauthorized' });
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const email = String(form.get('email') ?? '').trim();
		const groupId = Number(form.get('groupId'));
		if (!email || !Number.isFinite(groupId)) return fail(400, { message: 'invalid' });

		// create user if not exists (by email)
		let { data: u } = await supabase.from('user').select('*').eq('email', email).maybeSingle();
		if (!u) {
			const { data: created, error: cErr } = await supabase
				.from('user')
				.insert({ name: name || email.split('@')[0] || email, email })
				.select()
				.single();
			if (cErr) return fail(500, { message: cErr.message });
			u = created as any;
		}
		// add to group if not already
		const { data: existing } = await supabase
			.from('group_member')
			.select('user_id')
			.eq('group_id', groupId)
			.eq('user_id', (u as any).id)
			.maybeSingle();
		if (!existing) {
			const { error: gmErr } = await supabase
				.from('group_member')
				.insert({ group_id: groupId, user_id: (u as any).id });
			if (gmErr) return fail(500, { message: gmErr.message });
		}
		return { ok: true };
	},
	deleteGroup: async ({ request, locals, cookies }) => {
		const supabase = createSupabaseServer(cookies);
		if (!locals.user || locals.user.email !== ADMIN_EMAIL)
			return fail(401, { message: 'unauthorized' });
		const form = await request.formData();
		const groupId = Number(form.get('groupId'));
		if (!Number.isFinite(groupId)) return fail(400, { message: 'invalid' });

		// Determine orphan users before deleting memberships
		const { data: members, error: memErr } = await supabase
			.from('group_member')
			.select('user_id, group_id')
			.eq('group_id', groupId);
		if (memErr) return fail(500, { message: memErr.message });
		const memberUserIds = Array.from(new Set((members ?? []).map((m: any) => m.user_id)));

		let orphanUserIds: number[] = [];
		if (memberUserIds.length > 0) {
			const { data: allMemberships, error: allErr } = await supabase
				.from('group_member')
				.select('user_id, group_id')
				.in('user_id', memberUserIds as number[]);
			if (allErr) return fail(500, { message: allErr.message });
			const counts = new Map<number, number>();
			for (const row of allMemberships ?? []) {
				const uid = (row as any).user_id as number;
				counts.set(uid, (counts.get(uid) ?? 0) + 1);
			}
			for (const uid of memberUserIds) {
				if ((counts.get(uid) ?? 0) === 1) {
					orphanUserIds.push(uid);
				}
			}
		}

		// Best-effort clean-up of dependent rows (in case FKs are not cascading)
		await supabase.from('invite').delete().eq('group_id', groupId);
		await supabase.from('treat').delete().eq('group_id', groupId);
		await supabase.from('task').delete().eq('group_id', groupId);
		await supabase.from('group_member').delete().eq('group_id', groupId);

		const { error: delErr } = await supabase.from('group').delete().eq('id', groupId);
		if (delErr) return fail(500, { message: delErr.message });

		if (orphanUserIds.length > 0) {
			const { error: delUsersErr } = await supabase.from('user').delete().in('id', orphanUserIds);
			if (delUsersErr) return fail(500, { message: delUsersErr.message });
		}

		const gidCookie = cookies.get('gid');
		if (gidCookie && String(groupId) === gidCookie) {
			cookies.delete('gid', { path: '/' });
		}

		return { ok: true };
	}
};
