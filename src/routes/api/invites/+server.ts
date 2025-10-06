import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invite, group } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	const rows = await db.select().from(invite);
	return json(rows);
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const groupId = Number(body.groupId);
	const email = typeof body.email === 'string' ? body.email.trim() : '';

	if (!Number.isFinite(groupId)) throw error(400, 'groupId is required');
	if (!email) throw error(400, 'email is required');

	// ensure group exists
	const [g] = await db.select().from(group).where(eq(group.id, groupId)).limit(1);
	if (!g) throw error(404, 'group not found');

	const token = crypto.randomUUID();
	const [created] = await db
		.insert(invite)
		.values({ groupId, email, token, createdAt: Date.now() })
		.returning();
	return json(created, { status: 201 });
};
