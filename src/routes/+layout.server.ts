import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { group, groupMember } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals }) => {
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

	return {
		user: locals.user,
		groupId: locals.groupId,
		activeGroup
	};
};
