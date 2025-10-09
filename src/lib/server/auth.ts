import { createSupabaseServer } from '$lib/server/supabase';
import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { Cookies } from '@sveltejs/kit';

function hashPassword(password: string): string {
	// NOTE: Demo-only deterministic hash. Replace with bcrypt/argon2 in production.
	return createHash('sha256').update(password, 'utf8').digest('hex');
}

export async function createUserWithPassword(
	name: string,
	email: string,
	password: string,
	cookies?: Cookies
) {
	const passwordHash = await bcrypt.hash(password, 10);
	const supabase = cookies ? createSupabaseServer(cookies) : null;
	if (!supabase) throw new Error('Supabase cookies context required');
	const { data: u, error } = await supabase
		.from('user')
		.insert({ name, email, password_hash: passwordHash })
		.select()
		.single();
	if (error) throw error;
	return u as any;
}

export async function verifyPassword(email: string, password: string, cookies?: Cookies) {
	const supabase = cookies ? createSupabaseServer(cookies) : null;
	if (!supabase) throw new Error('Supabase cookies context required');
	const { data: u } = await supabase.from('user').select('*').eq('email', email).maybeSingle();
	if (!u || (u as any).password_hash == null) return null;

	const hash: string = (u as any).password_hash;
	const isBcrypt = hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$');

	if (isBcrypt) {
		const ok = await bcrypt.compare(password, hash);
		return ok ? (u as any) : null;
	}

	// Legacy sha256 fallback
	const legacy = hashPassword(password);
	if (legacy === hash) {
		// upgrade to bcrypt
		const newHash = await bcrypt.hash(password, 10);
		await supabase
			.from('user')
			.update({ password_hash: newHash })
			.eq('id', (u as any).id);
		return { ...(u as any), password_hash: newHash } as any;
	}
	return null;
}

export async function createSession(userId: number) {
	// No-op with Supabase Auth; left for compatibility if called elsewhere
	return { sid: '', expiresAt: 0 };
}

export async function destroySession(_sid: string) {
	// No-op with Supabase Auth
}

export async function changePassword(userId: number, newPassword: string, cookies?: Cookies) {
	const passwordHash = await bcrypt.hash(newPassword, 10);
	const supabase = cookies ? createSupabaseServer(cookies) : null;
	if (!supabase) throw new Error('Supabase cookies context required');
	await supabase.from('user').update({ password_hash: passwordHash }).eq('id', userId);
}
