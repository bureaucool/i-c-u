import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { createSupabaseServer } from '$lib/server/supabase';

export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
	const supabase = createSupabaseServer(cookies);
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'invalid id');

	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const title = typeof body.title === 'string' ? body.title.trim() : undefined;

	const updates: Record<string, unknown> = {};
	if (title !== undefined) updates.title = title;

	if (Object.keys(updates).length === 0) return json({});

	const { data: updated, error: uErr } = await supabase
		.from('group')
		.update(updates)
		.eq('id', id)
		.select()
		.single();
	if (uErr) throw error(500, uErr.message);
	if (!updated) throw error(404, 'group not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ params, locals, cookies }) => {
	const supabase = createSupabaseServer(cookies);
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'invalid id');
	if (!locals.user) throw error(401, 'unauthorized');

	// Ensure the requester is a member of the group
	const { data: m } = await supabase
		.from('group_member')
		.select('user_id')
		.eq('group_id', id)
		.eq('user_id', locals.user.id)
		.maybeSingle();
	if (!m) throw error(403, 'not a member of this group');

	const { error: dErr } = await supabase.from('group').delete().eq('id', id);
	if (dErr) throw error(500, dErr.message);
	return new Response(null, { status: 204 });
};
