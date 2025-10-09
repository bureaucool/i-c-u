import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { createSupabaseServer } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ cookies }) => {
	const supabase = createSupabaseServer(cookies);
	const { data, error: err } = await supabase.from('invite').select('*');
	if (err) throw error(500, err.message);
	return json(data ?? []);
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	const supabase = createSupabaseServer(cookies);
	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const groupId = Number(body.groupId);
	const email = typeof body.email === 'string' ? body.email.trim() : '';

	if (!Number.isFinite(groupId)) throw error(400, 'groupId is required');
	if (!email) throw error(400, 'email is required');

	// ensure group exists
	const { data: g, error: gErr } = await supabase
		.from('group')
		.select('id')
		.eq('id', groupId)
		.maybeSingle();
	if (gErr) throw error(500, gErr.message);
	if (!g) throw error(404, 'group not found');

	const token = crypto.randomUUID();
	const { data: created, error: cErr } = await supabase
		.from('invite')
		.insert({ group_id: groupId, email, token, created_at: Date.now() })
		.select()
		.single();
	if (cErr) throw error(500, cErr.message);
	return json(created, { status: 201 });
};
