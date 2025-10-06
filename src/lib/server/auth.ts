import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { session, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';

function hashPassword(password: string): string {
	// NOTE: Demo-only deterministic hash. Replace with bcrypt/argon2 in production.
	return createHash('sha256').update(password, 'utf8').digest('hex');
}

export async function createUserWithPassword(name: string, email: string, password: string) {
	const passwordHash = await bcrypt.hash(password, 10);
	const [u] = await db.insert(user).values({ name, email, passwordHash }).returning();
	return u;
}

export async function verifyPassword(email: string, password: string) {
	const [u] = await db.select().from(user).where(eq(user.email, email)).limit(1);
	if (!u || u.passwordHash == null) return null;

	const hash = u.passwordHash;
	const isBcrypt = hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$');

	if (isBcrypt) {
		const ok = await bcrypt.compare(password, hash);
		return ok ? u : null;
	}

	// Legacy sha256 fallback
	const legacy = hashPassword(password);
	if (legacy === hash) {
		// upgrade to bcrypt
		const newHash = await bcrypt.hash(password, 10);
		await db.update(user).set({ passwordHash: newHash }).where(eq(user.id, u.id)).run();
		return { ...u, passwordHash: newHash };
	}
	return null;
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
	const passwordHash = await bcrypt.hash(newPassword, 10);
	await db.update(user).set({ passwordHash }).where(eq(user.id, userId)).run();
}
