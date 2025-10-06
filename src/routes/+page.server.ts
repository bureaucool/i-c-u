import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { task, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) return { user: null };
	const gid = locals.groupId;
	const tasks = gid ? await db.select().from(task).where(eq(task.groupId, gid)) : [];
	const users = await db.select().from(user);
	return { user: locals.user, groupId: gid, tasks, users };
};
