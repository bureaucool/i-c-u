import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { task, treat, user, groupMember } from '$lib/server/db/schema';
import { and, eq, isNotNull, gte, lte, desc, inArray } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) return { user: null };
	const gid = locals.groupId;
	const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
	const recentSince = Date.now() - threeDaysMs;

	// Flexible range: parse from/to (ms timestamps). Defaults to last 30 days
	const now = Date.now();
	const defaultFrom = now - 30 * 24 * 60 * 60 * 1000;
	const parseTs = (v: string | null): number | null => {
		if (!v) return null;
		const n = Number(v);
		if (Number.isFinite(n)) return n;
		const d = Date.parse(v);
		return Number.isFinite(d) ? d : null;
	};
	const rangeFrom = parseTs(url.searchParams.get('from')) ?? defaultFrom;
	const rangeTo = parseTs(url.searchParams.get('to')) ?? now;

	const tasksDone = gid
		? await db
				.select()
				.from(task)
				.where(
					and(
						eq(task.groupId, gid),
						isNotNull(task.completedAt),
						gte(task.completedAt, rangeFrom),
						lte(task.completedAt, rangeTo)
					)
				)
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
	return {
		user: locals.user,
		groupId: gid,
		tasksDone,
		recentTasks,
		recentSince,
		treatsAll,
		users,
		rangeFrom,
		rangeTo
	};
};
