import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { createSession, destroySession, verifyPassword } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { groupMember } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const email = typeof body.email === 'string' ? body.email.trim() : '';
	const password = typeof body.password === 'string' ? body.password : '';
	if (!email || !password) throw error(400, 'email and password required');
	const u = await verifyPassword(email, password);
	if (!u) throw error(401, 'invalid credentials');
	const { sid, expiresAt } = await createSession(u.id);
	cookies.set('sid', sid, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7 });

	// If user has exactly one group, set it as active
	try {
		const groups = await db
			.select({ groupId: groupMember.groupId })
			.from(groupMember)
			.where(eq(groupMember.userId, u.id));
		if (groups.length === 1) {
			cookies.set('gid', String(groups[0].groupId), { path: '/', sameSite: 'lax' });
		}
	} catch {}
	return json({ ok: true, userId: u.id, expiresAt });
};

export const DELETE: RequestHandler = async ({ cookies }) => {
	const sid = cookies.get('sid');
	if (sid) await destroySession(sid);
	cookies.delete('sid', { path: '/' });
	return json({ ok: true });
};
