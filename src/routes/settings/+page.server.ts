import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { group, user } from '$lib/server/db/schema';
import { changePassword } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) return { user: null };
	const groups = await db.select().from(group);
	const users = await db.select().from(user);
	return { user: locals.user, groups, users };
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
