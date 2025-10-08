import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { task } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'invalid id');

	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const title = typeof body.title === 'string' ? body.title.trim() : undefined;
	const emoji =
		typeof (body as any).emoji === 'string' ? ((body as any).emoji as string) : undefined;
	const durationMinutes = body.durationMinutes == null ? undefined : Number(body.durationMinutes);
	const assignedUserId = body.assignedUserId == null ? undefined : Number(body.assignedUserId);
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
	if (title !== undefined) updates.title = title;
	if (emoji !== undefined) updates.emoji = emoji;
	if (durationMinutes !== undefined) {
		updates.durationMinutes = durationMinutes;
		// set completedAt when durationMinutes is set
		updates.completedAt = Date.now();
	}
	if (assignedUserId !== undefined) updates.assignedUserId = assignedUserId;
	if (scheduledAt !== undefined) updates.scheduledAt = scheduledAt;
	if (recurrenceType !== undefined) updates.recurrenceType = recurrenceType;
	if (recurrenceInterval !== undefined) updates.recurrenceInterval = recurrenceInterval;

	if (Object.keys(updates).length === 0) return json({});

	const [updated] = await db.update(task).set(updates).where(eq(task.id, id)).returning();
	if (!updated) throw error(404, 'task not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'invalid id');

	const [deleted] = await db.delete(task).where(eq(task.id, id)).returning();
	if (!deleted) throw error(404, 'task not found');
	return json({ ok: true });
};
