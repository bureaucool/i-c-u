import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { createSupabaseServer } from '$lib/server/supabase';

export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
	const supabase = createSupabaseServer(cookies);
	const taskId = Number(params.taskId);
	const subtaskId = Number(params.subtaskId);
	if (!Number.isFinite(taskId) || !Number.isFinite(subtaskId)) throw error(400, 'invalid id');

	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const completed =
		typeof (body as any).completed === 'boolean' ? ((body as any).completed as boolean) : undefined;
	if (completed === undefined) throw error(400, 'completed boolean is required');

	// Ensure the subtask belongs to the task
	const { data: existing, error: eErr } = await supabase
		.from('subtask')
		.select('id, task_id')
		.eq('id', subtaskId)
		.maybeSingle();
	if (eErr) throw error(500, eErr.message);
	if (!existing || existing.task_id !== taskId) throw error(404, 'subtask not found');

	const { data: updated, error: uErr } = await supabase
		.from('subtask')
		.update({ completed })
		.eq('id', subtaskId)
		.select()
		.single();
	if (uErr) throw error(500, uErr.message);

	return json({
		id: updated.id,
		taskId: updated.task_id,
		title: updated.title,
		orderNumber: updated.order_number,
		completed: updated.completed
	});
};
