import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { task, user } from '$lib/server/db/schema';
import { error, fail } from '@sveltejs/kit';
import { getEmojiForTitle } from '$lib/server/emoji';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) return { user: null };
	// TODO: filter by groups of current user; for now, return all
	const tasks = await db.select().from(task);
	const users = await db.select().from(user);
	return { user: locals.user, tasks, users };
};

export const actions: Actions = {
	createTask: async ({ request }) => {
		const form = await request.formData();
		const title = String(form.get('title') ?? '').trim();
		const groupId = Number(form.get('groupId'));
		const assignedUserId = form.get('assignedUserId') ? Number(form.get('assignedUserId')) : null;
		if (!title || !Number.isFinite(groupId)) return fail(400, { message: 'invalid input' });
		const emoji = await getEmojiForTitle(title);
		await db
			.insert(task)
			.values({ title, groupId, emoji: emoji ?? null, assignedUserId })
			.run();
		return { ok: true };
	},
	createTreat: async ({ request }) => {
		// Not implemented via form; use API for now
		throw error(400, 'use /api/treats');
	}
};
