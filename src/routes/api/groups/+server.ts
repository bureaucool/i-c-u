import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { createSupabaseServer } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ cookies }) => {
	const supabase = createSupabaseServer(cookies);
	const { data, error: err } = await supabase.from('group').select('*');
	if (err) throw error(500, err.message);
	return json(data ?? []);
};

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
	const supabase = createSupabaseServer(cookies);
	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const title = typeof body.title === 'string' ? body.title.trim() : '';
	const memberUserIds = Array.isArray(body.memberUserIds)
		? (body.memberUserIds as unknown[]).map((v) => Number(v)).filter((n) => Number.isFinite(n))
		: [];

	if (!title) throw error(400, 'title is required');

	const { data: created, error: cErr } = await supabase
		.from('group')
		.insert({ title })
		.select()
		.single();
	if (cErr) throw error(500, cErr.message);

	if (memberUserIds.length > 0) {
		// ensure users exist
		const { data: existingUsers, error: uErr } = await supabase
			.from('user')
			.select('id')
			.in('id', memberUserIds as number[]);
		if (uErr) throw error(500, uErr.message);
		const existingIds = new Set((existingUsers ?? []).map((u: any) => u.id));
		const toInsert = memberUserIds
			.filter((id) => existingIds.has(id))
			.map((id) => ({ group_id: created.id, user_id: id }));
		if (toInsert.length > 0) {
			const { error: gmErr } = await supabase.from('group_member').insert(toInsert);
			if (gmErr) throw error(500, gmErr.message);
		}
	}

	// Ensure the creator is a member and set active group cookie
	if (locals.user?.id) {
		const { data: existing } = await supabase
			.from('group_member')
			.select('user_id')
			.eq('group_id', created.id)
			.eq('user_id', locals.user.id)
			.maybeSingle();
		if (!existing) {
			const { error: gmErr } = await supabase
				.from('group_member')
				.insert({ group_id: created.id, user_id: locals.user.id });
			if (gmErr) throw error(500, gmErr.message);
		}
		cookies.set('gid', String(created.id), { path: '/', sameSite: 'lax' });
	}

	return json(created, { status: 201 });
};
