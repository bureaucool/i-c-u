import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'invalid id');

	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const name = typeof body.name === 'string' ? body.name.trim() : undefined;
	const availableTimeMinutesPerWeek =
		body.availableTimeMinutesPerWeek == null ? undefined : Number(body.availableTimeMinutesPerWeek);

	const updates: Record<string, unknown> = {};
	if (name !== undefined) updates.name = name;
	if (availableTimeMinutesPerWeek !== undefined)
		updates.availableTimeMinutesPerWeek = availableTimeMinutesPerWeek;

	if (Object.keys(updates).length === 0) return json({});

	const [updated] = await db.update(user).set(updates).where(eq(user.id, id)).returning();
	if (!updated) throw error(404, 'user not found');
	return json(updated);
};
