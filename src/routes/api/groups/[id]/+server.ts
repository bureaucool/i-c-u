import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { group } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

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
