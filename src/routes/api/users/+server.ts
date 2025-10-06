import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';

export const GET: RequestHandler = async () => {
	const rows = await db.select().from(user);
	return json(rows);
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => ({} as Record<string, unknown>));
	const name = typeof body.name === 'string' ? body.name.trim() : '';
	const email = typeof body.email === 'string' ? body.email.trim() : '';
	const availableTimeMinutesPerWeek = Number.isFinite(body.availableTimeMinutesPerWeek as number)
		? Number(body.availableTimeMinutesPerWeek)
		: 0;

	if (!name) throw error(400, 'name is required');
	if (!email) throw error(400, 'email is required');

	try {
		const [created] = await db
			.insert(user)
			.values({ name, email, availableTimeMinutesPerWeek })
			.returning();
		return json(created, { status: 201 });
	} catch (e) {
		// likely unique constraint on email
		throw error(409, 'email already exists');
	}
};


