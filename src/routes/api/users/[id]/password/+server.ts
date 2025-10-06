import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { changePassword } from '$lib/server/auth';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'invalid id');
	if (!locals.user || locals.user.id !== id) throw error(403, 'forbidden');
	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
	if (!newPassword) throw error(400, 'newPassword required');
	await changePassword(id, newPassword);
	return json({ ok: true });
};
