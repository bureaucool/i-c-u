import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { group, groupMember, user } from '$lib/server/db/schema';
import { changePassword, createUserWithPassword } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) return { user: null };
	const groups = await db
		.select({ id: group.id, title: group.title })
		.from(groupMember)
		.innerJoin(group, eq(groupMember.groupId, group.id))
		.where(eq(groupMember.userId, locals.user.id));
	const users = await db.select().from(user);
	// fetch current user availability
	const [me] = await db.select().from(user).where(eq(user.id, locals.user.id)).limit(1);
	// members of current group
	let members: Array<{ id: number; name: string; email: string | null }> = [];
	if (locals.groupId) {
		members = await db
			.select({ id: user.id, name: user.name, email: user.email })
			.from(groupMember)
			.innerJoin(user, eq(groupMember.userId, user.id))
			.where(eq(groupMember.groupId, locals.groupId));
	}
	return {
		user: { ...locals.user, availableTimeMinutesPerWeek: me?.availableTimeMinutesPerWeek ?? null },
		groupId: locals.groupId,
		groups,
		users,
		members
	};
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
	},
	addMember: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'unauthorized' });
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		const name = String((form.get('name') ?? '').toString().trim() || email.split('@')[0] || '');
		const password = String(form.get('password') ?? '');
		const groupId = locals.groupId;
		if (!email || !password || !Number.isFinite(groupId)) return fail(400, { message: 'invalid' });

		// Create user if not exists
		let u = await db
			.select()
			.from(user)
			.where(eq(user.email, email))
			.limit(1)
			.then((r) => r[0]);
		if (!u) {
			u = await createUserWithPassword(name, email, password);
		} else {
			// ensure has password
			if (!u.passwordHash) {
				await changePassword(u.id, password);
			}
		}

		// add membership if not present
		const [m] = await db
			.select()
			.from(groupMember)
			.where(and(eq(groupMember.groupId, groupId as number), eq(groupMember.userId, u.id)))
			.limit(1);
		if (!m) {
			await db
				.insert(groupMember)
				.values({ groupId: groupId as number, userId: u.id })
				.run();
		}
		return { ok: true };
	},
	removeMember: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'unauthorized' });
		const form = await request.formData();
		const userId = Number(form.get('userId'));
		const groupId = locals.groupId;
		if (!Number.isFinite(userId) || !Number.isFinite(groupId))
			return fail(400, { message: 'invalid' });

		await db
			.delete(groupMember)
			.where(and(eq(groupMember.groupId, groupId as number), eq(groupMember.userId, userId)))
			.run();
		return { ok: true };
	}
};
