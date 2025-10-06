import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { group, groupMember, user } from '$lib/server/db/schema';
import { createSession, createUserWithPassword } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	return { user: locals.user };
};

export const actions: Actions = {
	create: async ({ request, cookies }) => {
		const form = await request.formData();
		const title = String(form.get('title') ?? '').trim();
		const name = String(form.get('name') ?? '').trim();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');
		if (!title || !name || !email || !password) return fail(400, { message: 'invalid' });
		const [g] = await db.insert(group).values({ title }).returning();
		const u = await createUserWithPassword(name, email, password);
		await db.insert(groupMember).values({ groupId: g.id, userId: u.id }).run();
		const { sid } = await createSession(u.id);
		cookies.set('sid', sid, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7
		});
		throw redirect(303, '/');
	}
};
