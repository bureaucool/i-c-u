import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { group, groupMember, task, user } from '$lib/server/db/schema';
import { and, eq, isNotNull, gte, lte, inArray } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	let activeGroup: { id: number; title: string } | null = null;
	const gid = locals.groupId;
	if (locals.user && gid) {
		const [g] = await db
			.select({ id: group.id, title: group.title })
			.from(groupMember)
			.innerJoin(group, eq(groupMember.groupId, group.id))
			.where(and(eq(groupMember.userId, locals.user.id), eq(groupMember.groupId, gid)))
			.limit(1);
		activeGroup = g ?? null;
	}

	// Global availability-adjusted percentages over a range (7 or 30 days)
	let adjustedPercentages: [number, number] = [0, 0];
	let rangeDays = 7;
	if (locals.user && gid) {
		const r = Number(url.searchParams.get('range'));
		rangeDays = r === 30 ? 30 : 7;
		const now = Date.now();
		const from = now - rangeDays * 24 * 60 * 60 * 1000;

		const tasksInRange = await db
			.select()
			.from(task)
			.where(
				and(
					eq(task.groupId, gid),
					isNotNull(task.completedAt),
					gte(task.completedAt, from),
					lte(task.completedAt, now)
				)
			);

		const youId = locals.user.id;
		const youMinutes = tasksInRange
			.filter((t) => t.assignedUserId === youId)
			.reduce((acc, t) => acc + (Number((t as any).durationMinutes ?? 0) || 0), 0);
		const othersMinutes = tasksInRange
			.filter((t) => t.assignedUserId == null || t.assignedUserId !== youId)
			.reduce((acc, t) => acc + (Number((t as any).durationMinutes ?? 0) || 0), 0);

		// Availability sums
		const memberIds = await db
			.select({ userId: groupMember.userId })
			.from(groupMember)
			.where(eq(groupMember.groupId, gid));
		const ids = memberIds.map((m) => m.userId);
		const groupUsers = ids.length ? await db.select().from(user).where(inArray(user.id, ids)) : [];

		const youAvail =
			Number((groupUsers.find((u) => u.id === youId) as any)?.availableTimeMinutesPerWeek ?? 0) ||
			0;
		const othersAvail = groupUsers
			.filter((u) => u.id !== youId)
			.reduce((acc, u: any) => acc + (Number(u?.availableTimeMinutesPerWeek ?? 0) || 0), 0);

		const youNorm = youAvail > 0 ? youMinutes / youAvail : 0;
		const othersNorm = othersAvail > 0 ? othersMinutes / othersAvail : 0;
		const normSum = youNorm + othersNorm;
		const yourAdjPercent = normSum ? Math.round((youNorm / normSum) * 100) : 0;
		adjustedPercentages = [yourAdjPercent, 100 - yourAdjPercent];
	}

	return {
		user: locals.user,
		groupId: locals.groupId,
		activeGroup,
		globalAdjustedPercentages: adjustedPercentages,
		rangeDays
	};
};
