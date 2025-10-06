import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { group, groupMember, user } from '$lib/server/db/schema';
import { inArray } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	const rows = await db.select().from(group);
	return json(rows);
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const title = typeof body.title === 'string' ? body.title.trim() : '';
	const memberUserIds = Array.isArray(body.memberUserIds)
		? (body.memberUserIds as unknown[]).map((v) => Number(v)).filter((n) => Number.isFinite(n))
		: [];

	if (!title) throw error(400, 'title is required');

	const [created] = await db.insert(group).values({ title }).returning();

	if (memberUserIds.length > 0) {
		// ensure users exist
		const existingUsers = await db
			.select({ id: user.id })
			.from(user)
			.where(inArray(user.id, memberUserIds as number[]));
		const existingIds = new Set(existingUsers.map((u) => u.id));
		const toInsert = memberUserIds
			.filter((id) => existingIds.has(id))
			.map((id) => ({ groupId: created.id, userId: id }));
		if (toInsert.length > 0) await db.insert(groupMember).values(toInsert);
	}

	return json(created, { status: 201 });
};
