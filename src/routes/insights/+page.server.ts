import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { task, treat, user } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) return { user: null };
	const tasksDone = await db.select().from(task).where(task.durationMinutes.isNotNull());
	const treatsAll = await db.select().from(treat);
	const users = await db.select().from(user);
	return { user: locals.user, tasksDone, treatsAll, users };
};


