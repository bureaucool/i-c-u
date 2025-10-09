import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { createSupabaseServer } from '$lib/server/supabase';

export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
	const supabase = createSupabaseServer(cookies);
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'invalid id');

	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const name = typeof body.name === 'string' ? body.name.trim() : undefined;
	const availableTimeMinutesPerWeek =
		body.availableTimeMinutesPerWeek == null ? undefined : Number(body.availableTimeMinutesPerWeek);

	const updates: Record<string, unknown> = {};
	if (name !== undefined) updates.name = name;
	if (availableTimeMinutesPerWeek !== undefined)
		updates.available_time_minutes_per_week = availableTimeMinutesPerWeek;

	if (Object.keys(updates).length === 0) return json({});

	const { data: updated, error: uErr } = await supabase
		.from('user')
		.update(updates)
		.eq('id', id)
		.select()
		.single();
	if (uErr) throw error(500, uErr.message);
	if (!updated) throw error(404, 'user not found');
	return json(updated);
};
