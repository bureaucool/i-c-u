import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { createSupabaseServer } from '$lib/server/supabase';

export const PATCH: RequestHandler = async ({ params, request, locals, cookies }) => {
	const supabase = createSupabaseServer(cookies);
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'invalid id');

	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const title = typeof body.title === 'string' ? body.title.trim() : undefined;
	const emoji =
		typeof (body as any).emoji === 'string' ? ((body as any).emoji as string) : undefined;
	const durationMinutes = body.durationMinutes == null ? undefined : Number(body.durationMinutes);
	// Explicit null clears assignment; undefined means don't change
	let assignedUserId =
		(body as any).assignedUserId === null
			? null
			: body.assignedUserId == null
				? undefined
				: Number(body.assignedUserId);
	// Accept explicit null to clear scheduledAt; undefined means don't touch
	const scheduledAt =
		(body as any).scheduledAt === null
			? null
			: (body as any).scheduledAt === undefined
				? undefined
				: Number((body as any).scheduledAt);
	const recurrenceType = typeof body.recurrenceType === 'string' ? body.recurrenceType : undefined;
	const recurrenceInterval =
		body.recurrenceInterval == null ? undefined : Number(body.recurrenceInterval);

	const updates: Record<string, unknown> = {};

	// Load existing to decide completion semantics
	const { data: existing, error: eErr } = await supabase
		.from('task')
		.select('*')
		.eq('id', id)
		.maybeSingle();
	if (eErr) throw error(500, eErr.message);
	if (!existing) throw error(404, 'task not found');
	if (title !== undefined) updates.title = title;
	if (emoji !== undefined) updates.emoji = emoji;
	if (durationMinutes !== undefined) {
		updates.duration_minutes = durationMinutes;
		// If not previously completed, mark completed now and attribute to current user
		if (existing.completed_at == null) {
			updates.completed_at = Date.now();
			if (locals.user?.id != null) {
				assignedUserId = Number(locals.user.id);
			}
		}
		// else keep original completedAt and assignedUserId unless explicitly set by payload
	}
	if (assignedUserId !== undefined) updates.assigned_user_id = assignedUserId;
	if (scheduledAt !== undefined) updates.scheduled_at = scheduledAt;
	if (recurrenceType !== undefined) updates.recurrence_type = recurrenceType;
	if (recurrenceInterval !== undefined) updates.recurrence_interval = recurrenceInterval;

	if (Object.keys(updates).length === 0) return json({});

	const { data: updated, error: uErr } = await supabase
		.from('task')
		.update(updates)
		.eq('id', id)
		.select()
		.single();
	if (uErr) throw error(500, uErr.message);
	if (!updated) throw error(404, 'task not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ params, cookies }) => {
	const supabase = createSupabaseServer(cookies);
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'invalid id');

	const { data: deleted, error: dErr } = await supabase
		.from('task')
		.delete()
		.eq('id', id)
		.select()
		.single();
	if (dErr) throw error(500, dErr.message);
	if (!deleted) throw error(404, 'task not found');
	return json({ ok: true });
};
