import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { treat } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'invalid id');

	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const accepted = typeof body.accepted === 'boolean' ? body.accepted : undefined;

	const updates: Record<string, unknown> = {};
	if (accepted !== undefined) updates.accepted = accepted;

	if (Object.keys(updates).length === 0) return json({});

	const [updated] = await db.update(treat).set(updates).where(eq(treat.id, id)).returning();
	if (!updated) throw error(404, 'treat not found');
	return json(updated);
};
