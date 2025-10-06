import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { task, group, user, groupMember } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { getEmojiForTitle } from '$lib/server/emoji';

export const GET: RequestHandler = async ({ url }) => {
	const groupIdParam = url.searchParams.get('groupId');
	const groupId = groupIdParam ? Number(groupIdParam) : undefined;

	if (groupId !== undefined && !Number.isFinite(groupId)) throw error(400, 'invalid groupId');

	const query = db.select().from(task);
	const rows = await (groupId ? query.where(eq(task.groupId, groupId)) : query);
	return json(rows);
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const title = typeof body.title === 'string' ? body.title.trim() : '';
	const groupId = Number(body.groupId);
	const assignedUserId = body.assignedUserId == null ? null : Number(body.assignedUserId);
	const scheduledAt = body.scheduledAt == null ? null : Number(body.scheduledAt);
	const recurrenceType = typeof body.recurrenceType === 'string' ? body.recurrenceType : null;
	const recurrenceInterval =
		body.recurrenceInterval == null ? null : Number(body.recurrenceInterval);

	if (!title) throw error(400, 'title is required');
	if (!Number.isFinite(groupId)) throw error(400, 'groupId is required');

	// validate group
	const [g] = await db.select().from(group).where(eq(group.id, groupId)).limit(1);
	if (!g) throw error(404, 'group not found');

	// validate user if provided
	if (assignedUserId != null) {
		if (!Number.isFinite(assignedUserId)) throw error(400, 'invalid assignedUserId');
		const [u] = await db.select().from(user).where(eq(user.id, assignedUserId)).limit(1);
		if (!u) throw error(404, 'assigned user not found');
		// ensure assigned user is member of the group
		const [m] = await db
			.select()
			.from(groupMember)
			.where(and(eq(groupMember.groupId, groupId), eq(groupMember.userId, assignedUserId)))
			.limit(1);
		if (!m) throw error(400, 'assigned user not in group');
	}

	const emoji = await getEmojiForTitle(title);

	const [created] = await db
		.insert(task)
		.values({
			title,
			groupId,
			emoji: emoji ?? null,
			assignedUserId: assignedUserId ?? null,
			scheduledAt: scheduledAt ?? null,
			recurrenceType: recurrenceType ?? null,
			recurrenceInterval: recurrenceInterval ?? null
		})
		.returning();

	return json(created, { status: 201 });
};
