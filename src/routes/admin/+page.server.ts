import type { Actions, PageServerLoad } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { group, groupMember, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { createUserWithPassword } from '$lib/server/auth';

const ADMIN_EMAIL = 'mail@benw.de';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.email !== ADMIN_EMAIL) throw redirect(302, '/');

	const groups = await db.select().from(group);
	// Members by group
	const membersByGroup: Record<number, Array<{ id: number; name: string; email: string }>> = {};
	for (const g of groups) {
		const members = await db
			.select({ id: user.id, name: user.name, email: user.email })
			.from(groupMember)
			.innerJoin(user, eq(groupMember.userId, user.id))
			.where(eq(groupMember.groupId, g.id));
		membersByGroup[g.id] = members as any;
	}
	return { groups, membersByGroup };
};

export const actions: Actions = {
	createGroup: async ({ request, locals }) => {
		if (!locals.user || locals.user.email !== ADMIN_EMAIL)
			return fail(401, { message: 'unauthorized' });
		const form = await request.formData();
		const title = String(form.get('title') ?? '').trim();
		if (!title) return fail(400, { message: 'invalid' });
		await db.insert(group).values({ title }).run();
		return { ok: true };
	},
	addMember: async ({ request, locals }) => {
		if (!locals.user || locals.user.email !== ADMIN_EMAIL)
			return fail(401, { message: 'unauthorized' });
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');
		const groupId = Number(form.get('groupId'));
		if (!email || !password || !Number.isFinite(groupId)) return fail(400, { message: 'invalid' });

		// create user if not exists
		let u = await db
			.select()
			.from(user)
			.where(eq(user.email, email))
			.limit(1)
			.then((r) => r[0]);
		if (!u) {
			u = await createUserWithPassword(name || email.split('@')[0] || email, email, password);
		}
		// add to group if not already
		const existing = await db
			.select()
			.from(groupMember)
			.where(eq(groupMember.groupId, groupId))
			.then((ms) => ms.find((m) => (m as any).userId === u!.id));
		if (!existing) {
			await db.insert(groupMember).values({ groupId, userId: u.id }).run();
		}
		return { ok: true };
	}
};
