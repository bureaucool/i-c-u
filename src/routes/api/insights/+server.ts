import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { task, user, groupMember } from '$lib/server/db/schema';
import { and, eq, isNotNull, gte, lte, inArray } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || !locals.groupId)
		return new Response(JSON.stringify({ percentages: [0, 0] }), { status: 200 });
	const gid = locals.groupId;
	const youId = locals.user.id;
	const r = Number(url.searchParams.get('range'));
	const rangeDays = r === 30 ? 30 : 7;
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

	const youMinutes = tasksInRange
		.filter((t) => t.assignedUserId === youId)
		.reduce((acc, t) => acc + (Number((t as any).durationMinutes ?? 0) || 0), 0);
	const othersMinutes = tasksInRange
		.filter((t) => t.assignedUserId == null || t.assignedUserId !== youId)
		.reduce((acc, t) => acc + (Number((t as any).durationMinutes ?? 0) || 0), 0);

	const memberIds = await db
		.select({ userId: groupMember.userId })
		.from(groupMember)
		.where(eq(groupMember.groupId, gid));
	const ids = memberIds.map((m) => m.userId);
	const groupUsers = ids.length ? await db.select().from(user).where(inArray(user.id, ids)) : [];

	const youAvail =
		Number((groupUsers.find((u) => u.id === youId) as any)?.availableTimeMinutesPerWeek ?? 0) || 0;
	const othersAvail = groupUsers
		.filter((u) => u.id !== youId)
		.reduce((acc, u: any) => acc + (Number(u?.availableTimeMinutesPerWeek ?? 0) || 0), 0);

	const youNorm = youAvail > 0 ? youMinutes / youAvail : 0;
	const othersNorm = othersAvail > 0 ? othersMinutes / othersAvail : 0;
	const normSum = youNorm + othersNorm;
	const yourAdjPercent = normSum ? Math.round((youNorm / normSum) * 100) : 0;
	const percentages = [yourAdjPercent, 100 - yourAdjPercent] as [number, number];

	return new Response(JSON.stringify({ percentages }), {
		status: 200,
		headers: { 'content-type': 'application/json' }
	});
};
