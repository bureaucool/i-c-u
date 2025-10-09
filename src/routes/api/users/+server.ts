import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { createSupabaseServer } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ cookies }) => {
	const supabase = createSupabaseServer(cookies);
	const { data, error: err } = await supabase.from('user').select('*');
	if (err) throw error(500, err.message);
	return json(data ?? []);
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	const supabase = createSupabaseServer(cookies);
	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const name = typeof body.name === 'string' ? body.name.trim() : '';
	const email = typeof body.email === 'string' ? body.email.trim() : '';
	const availableTimeMinutesPerWeek = Number.isFinite(body.availableTimeMinutesPerWeek as number)
		? Number(body.availableTimeMinutesPerWeek)
		: 0;

	if (!name) throw error(400, 'name is required');
	if (!email) throw error(400, 'email is required');

	const { data: created, error: cErr } = await supabase
		.from('user')
		.insert({ name, email, available_time_minutes_per_week: availableTimeMinutesPerWeek })
		.select()
		.single();
	if (cErr) throw error(cErr.code === '23505' ? 409 : 500, cErr.message);
	return json(created, { status: 201 });
};
