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
	}
};
