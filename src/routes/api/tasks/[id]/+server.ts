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
	const description =
		(body as any).description === null
			? null
			: typeof body.description === 'string'
				? body.description.trim()
				: undefined;
	const subtasks = Array.isArray(body.subtasks) ? body.subtasks : undefined;

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
	if (description !== undefined) updates.description = description;

	// Update subtasks if provided
	if (subtasks !== undefined) {
		// Delete existing subtasks
		const { error: delErr } = await supabase.from('subtask').delete().eq('task_id', id);

		if (delErr) throw error(500, delErr.message);

		// Insert new subtasks
		if (subtasks.length > 0) {
			const subtaskInserts = subtasks.map((st: any, index: number) => ({
				task_id: id,
				title: typeof st.title === 'string' ? st.title.trim() : '',
				order_number: typeof st.orderNumber === 'number' ? st.orderNumber : index,
				completed: typeof st.completed === 'boolean' ? st.completed : false
			}));

			const { error: insErr } = await supabase.from('subtask').insert(subtaskInserts);

			if (insErr) throw error(500, insErr.message);
		}
	}

	if (Object.keys(updates).length === 0 && subtasks === undefined) return json({});

	let updated = existing;
	if (Object.keys(updates).length > 0) {
		const { data: updatedData, error: uErr } = await supabase
			.from('task')
			.update(updates)
			.eq('id', id)
			.select()
			.single();
		if (uErr) throw error(500, uErr.message);
		if (!updatedData) throw error(404, 'task not found');
		updated = updatedData;
	}

	// Fetch updated subtasks
	const { data: updatedSubtasks, error: subErr } = await supabase
		.from('subtask')
		.select('*')
		.eq('task_id', id)
		.order('order_number', { ascending: true });

	if (subErr) throw error(500, subErr.message);

	// Convert subtasks to camelCase
	(updated as any).subtasks = (updatedSubtasks ?? []).map((st: any) => ({
		id: st.id,
		taskId: st.task_id,
		title: st.title,
		orderNumber: st.order_number,
		completed: st.completed
	}));

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
