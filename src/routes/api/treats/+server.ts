import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { treat, group, user, groupMember } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { getEmojiForTitle } from '$lib/server/emoji';

export const GET: RequestHandler = async ({ url }) => {
	const groupIdParam = url.searchParams.get('groupId');
	const groupId = groupIdParam ? Number(groupIdParam) : undefined;
	if (groupId !== undefined && !Number.isFinite(groupId)) throw error(400, 'invalid groupId');

	const query = db.select().from(treat);
	const rows = await (groupId ? query.where(eq(treat.groupId, groupId)) : query);
	return json(rows);
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const title = typeof body.title === 'string' ? body.title.trim() : '';
	const groupId = Number(body.groupId);
	const fromUserId = Number(body.fromUserId);
	const toUserId = Number(body.toUserId);
	const valueMinutes = Number(body.valueMinutes);

	if (!title) throw error(400, 'title is required');
	if (!Number.isFinite(groupId)) throw error(400, 'groupId is required');
	if (!Number.isFinite(fromUserId)) throw error(400, 'fromUserId is required');
	if (!Number.isFinite(toUserId)) throw error(400, 'toUserId is required');
	if (!Number.isFinite(valueMinutes)) throw error(400, 'valueMinutes is required');

	// validate group and users
	const [g] = await db.select().from(group).where(eq(group.id, groupId)).limit(1);
	if (!g) throw error(404, 'group not found');

	const [fu] = await db.select().from(user).where(eq(user.id, fromUserId)).limit(1);
	if (!fu) throw error(404, 'from user not found');
	const [tu] = await db.select().from(user).where(eq(user.id, toUserId)).limit(1);
	if (!tu) throw error(404, 'to user not found');

	// ensure both users are in the group
	const [fm] = await db
		.select()
		.from(groupMember)
		.where(and(eq(groupMember.groupId, groupId), eq(groupMember.userId, fromUserId)))
		.limit(1);
	if (!fm) throw error(400, 'from user not in group');
	const [tm] = await db
		.select()
		.from(groupMember)
		.where(and(eq(groupMember.groupId, groupId), eq(groupMember.userId, toUserId)))
		.limit(1);
	if (!tm) throw error(400, 'to user not in group');

	const emoji = await getEmojiForTitle(title);

	const [created] = await db
		.insert(treat)
		.values({
			title,
			groupId,
			emoji: emoji ?? null,
			fromUserId,
			toUserId,
			valueMinutes,
			accepted: false,
			createdAt: Date.now()
		})
		.returning();

	return json(created, { status: 201 });
};
