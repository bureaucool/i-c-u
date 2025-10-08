import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { task, treat, user, groupMember } from '$lib/server/db/schema';
import { and, eq, isNotNull, gte, desc, inArray } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) return { user: null };
	const gid = locals.groupId;
	const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
	const recentSince = Date.now() - threeDaysMs;

	const tasksDone = gid
		? await db
				.select()
				.from(task)
				.where(and(eq(task.groupId, gid), isNotNull(task.completedAt)))
				.orderBy(desc(task.completedAt))
		: [];

	const recentTasks = gid
		? await db
				.select()
				.from(task)
				.where(
					and(
						eq(task.groupId, gid),
						isNotNull(task.completedAt),
						gte(task.completedAt, recentSince)
					)
				)
				.orderBy(desc(task.completedAt))
		: [];

	const treatsAll = gid ? await db.select().from(treat).where(eq(treat.groupId, gid)) : [];
	const members = gid
		? await db.select().from(groupMember).where(eq(groupMember.groupId, gid))
		: [];
	const memberIds = members.map((m) => m.userId);
	const users = memberIds.length
		? await db.select().from(user).where(inArray(user.id, memberIds))
		: [];
	return { user: locals.user, groupId: gid, tasksDone, recentTasks, recentSince, treatsAll, users };
};
