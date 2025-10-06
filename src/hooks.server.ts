import type { Handle } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { session, user } from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export const handle: Handle = async ({ event, resolve }) => {
	const sid = event.cookies.get('sid');
	let currentUser: { id: number; name: string; email: string } | null = null;
	let currentGroupId: number | null = null;
	if (sid) {
		const [s] = await db.select().from(session).where(eq(session.id, sid)).limit(1);
		if (s && s.expiresAt > Date.now()) {
			const [u] = await db.select().from(user).where(eq(user.id, s.userId)).limit(1);
			if (u) currentUser = { id: u.id, name: u.name, email: u.email };
		}
	}

	// choose group from cookie if set
	const gid = event.cookies.get('gid');
	if (gid && /^\d+$/.test(gid)) currentGroupId = Number(gid);

	event.locals.user = currentUser;
	event.locals.groupId = currentGroupId;

	// Enforce auth on API routes except auth endpoint
	if (event.url.pathname.startsWith('/api') && !event.url.pathname.startsWith('/api/auth')) {
		if (!event.locals.user) {
			return new Response(JSON.stringify({ error: 'unauthorized' }), {
				status: 401,
				headers: { 'content-type': 'application/json' }
			});
		}
	}

	return resolve(event);
};
