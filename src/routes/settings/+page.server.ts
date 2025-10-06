import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { group, groupMember, user } from '$lib/server/db/schema';
import { changePassword } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) return { user: null };
	const groups = await db
		.select({ id: group.id, title: group.title })
		.from(groupMember)
		.innerJoin(group, eq(groupMember.groupId, group.id))
		.where(eq(groupMember.userId, locals.user.id));
	const users = await db.select().from(user);
	return { user: locals.user, groupId: locals.groupId, groups, users };
};

export const actions: Actions = {
	updateGroup: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'unauthorized' });
		const form = await request.formData();
		const id = Number(form.get('groupId'));
		const title = String(form.get('title') ?? '').trim();
		if (!Number.isFinite(id) || !title) return fail(400, { message: 'invalid' });
		await db.update(group).set({ title }).where(eq(group.id, id)).run();
		return { ok: true };
	},
	selectGroup: async ({ request, locals, cookies }) => {
		if (!locals.user) return fail(401, { message: 'unauthorized' });
		const form = await request.formData();
		const id = Number(form.get('groupId'));
		if (!Number.isFinite(id)) return fail(400, { message: 'invalid' });
		// ensure membership
		const [m] = await db
			.select()
			.from(groupMember)
			.where(and(eq(groupMember.groupId, id), eq(groupMember.userId, locals.user.id)))
			.limit(1);
		if (!m) return fail(403, { message: 'not a member' });
		cookies.set('gid', String(id), { path: '/', sameSite: 'lax' });
		return { ok: true };
	},
	updateAvailability: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'unauthorized' });
		const form = await request.formData();
		const id = Number(form.get('userId'));
		const minutes = Number(form.get('availableTimeMinutesPerWeek'));
		if (!Number.isFinite(id) || !Number.isFinite(minutes)) return fail(400, { message: 'invalid' });
		await db
			.update(user)
			.set({ availableTimeMinutesPerWeek: minutes })
			.where(eq(user.id, id))
			.run();
		return { ok: true };
	},
	changePassword: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'unauthorized' });
		const form = await request.formData();
		const newPassword = String(form.get('newPassword') ?? '');
		if (!newPassword) return fail(400, { message: 'invalid' });
		await changePassword(locals.user.id, newPassword);
		return { ok: true };
	}
};
