import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { session, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

function hashPassword(password: string): string {
	// NOTE: For demo only. Replace with proper password hashing (bcrypt/argon2) in production.
	return crypto.subtle ? '' : Buffer.from(`sha1:${password}`).toString('base64');
}

export async function createUserWithPassword(name: string, email: string, password: string) {
	const passwordHash = hashPassword(password);
	const [u] = await db.insert(user).values({ name, email, passwordHash }).returning();
	return u;
}

export async function verifyPassword(email: string, password: string) {
	const [u] = await db.select().from(user).where(eq(user.email, email)).limit(1);
	if (!u || !u.passwordHash) return null;
	const passwordHash = hashPassword(password);
	if (passwordHash !== u.passwordHash) return null;
	return u;
}

export async function createSession(userId: number) {
	const sid = crypto.randomUUID();
	const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
	await db.insert(session).values({ id: sid, userId, expiresAt }).run();
	return { sid, expiresAt };
}

export async function destroySession(sid: string) {
	await db.delete(session).where(eq(session.id, sid)).run();
}

export async function changePassword(userId: number, newPassword: string) {
	const passwordHash = hashPassword(newPassword);
	await db.update(user).set({ passwordHash }).where(eq(user.id, userId)).run();
}
