import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { task, user, treat } from '$lib/server/db/schema';
import { eq, and, isNull, isNotNull, desc, or, not } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) return { user: null };
	const gid = locals.groupId;
	const tasks = gid ? await db.select().from(task).where(eq(task.groupId, gid)) : [];
	// Split active vs completed on the server for convenience
	const active = gid
		? await db
				.select()
				.from(task)
				.where(and(eq(task.groupId, gid), isNull(task.completedAt)))
		: [];
	const completed = gid
		? await db
				.select()
				.from(task)
				.where(and(eq(task.groupId, gid), isNotNull(task.completedAt)))
				.orderBy(desc(task.completedAt))
		: [];
	// Revert: show all users (settings page handles membership separately)
	const users = await db.select().from(user);
	// Show pending treats to accept (you are recipient and not yet accepted)
	const pendingTreats = gid
		? await db
				.select()
				.from(treat)
				.where(
					and(eq(treat.groupId, gid), eq(treat.toUserId, locals.user.id), eq(treat.accepted, false))
				)
		: [];

	// Show one-time notification to the creator when a treat they sent was accepted
	const acceptedTreatsToNotify = gid
		? await db
				.select()
				.from(treat)
				.where(
					and(
						eq(treat.groupId, gid),
						eq(treat.fromUserId, locals.user.id),
						eq(treat.accepted, true),
						or(
							eq(treat.acceptedNotifiedAt as any, null),
							not(isNotNull(treat.acceptedNotifiedAt as any))
						)
					)
				)
				.orderBy(desc(treat.acceptedAt as any))
		: [];
	return {
		user: locals.user,
		groupId: gid,
		tasks,
		activeTasks: active,
		completedTasks: completed,
		users,
		pendingTreats,
		acceptedTreatsToNotify
	};
};
