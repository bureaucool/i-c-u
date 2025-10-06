import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { task } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'invalid id');

	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const durationMinutes = body.durationMinutes == null ? undefined : Number(body.durationMinutes);
	const assignedUserId = body.assignedUserId == null ? undefined : Number(body.assignedUserId);
	const scheduledAt = body.scheduledAt == null ? undefined : Number(body.scheduledAt);

	const updates: Record<string, unknown> = {};
	if (durationMinutes !== undefined) updates.durationMinutes = durationMinutes;
	if (assignedUserId !== undefined) updates.assignedUserId = assignedUserId;
	if (scheduledAt !== undefined) updates.scheduledAt = scheduledAt;

	if (Object.keys(updates).length === 0) return json({});

	const [updated] = await db.update(task).set(updates).where(eq(task.id, id)).returning();
	if (!updated) throw error(404, 'task not found');
	return json(updated);
};
