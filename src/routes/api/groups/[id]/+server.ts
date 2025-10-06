import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { group, groupMember } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'invalid id');

	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const title = typeof body.title === 'string' ? body.title.trim() : undefined;

	const updates: Record<string, unknown> = {};
	if (title !== undefined) updates.title = title;

	if (Object.keys(updates).length === 0) return json({});

	const [updated] = await db.update(group).set(updates).where(eq(group.id, id)).returning();
	if (!updated) throw error(404, 'group not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'invalid id');
	if (!locals.user) throw error(401, 'unauthorized');

	// Ensure the requester is a member of the group
	const [m] = await db
		.select()
		.from(groupMember)
		.where(and(eq(groupMember.groupId, id), eq(groupMember.userId, locals.user.id)))
		.limit(1);
	if (!m) throw error(403, 'not a member of this group');

	await db.delete(group).where(eq(group.id, id)).run();
	return new Response(null, { status: 204 });
};
