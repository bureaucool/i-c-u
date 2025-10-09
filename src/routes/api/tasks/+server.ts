import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getEmojiForTitle } from '$lib/server/emoji';
import { createSupabaseServer } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ url, locals, cookies }) => {
	const supabase = createSupabaseServer(cookies);
	const groupIdParam = url.searchParams.get('groupId');
	const groupId = groupIdParam ? Number(groupIdParam) : (locals.groupId ?? undefined);

	if (groupId !== undefined && !Number.isFinite(groupId)) throw error(400, 'invalid groupId');

	let q = supabase.from('task').select('*');
	if (groupId != null) q = q.eq('group_id', groupId);
	const { data, error: err } = await q;
	if (err) throw error(500, err.message);
	return json(data ?? []);
};

export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	const supabase = createSupabaseServer(cookies);
	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const title = typeof body.title === 'string' ? body.title.trim() : '';
	const groupId =
		body.groupId == null ? (locals.groupId as number | undefined) : Number(body.groupId);
	const emojiInput =
		typeof (body as any).emoji === 'string' && (body as any).emoji.length > 0
			? ((body as any).emoji as string)
			: null;
	const assignedUserId = body.assignedUserId == null ? null : Number(body.assignedUserId);
	const scheduledAt = body.scheduledAt == null ? null : Number(body.scheduledAt);
	const recurrenceType = typeof body.recurrenceType === 'string' ? body.recurrenceType : null;
	const recurrenceInterval =
		body.recurrenceInterval == null ? null : Number(body.recurrenceInterval);

	if (!title) throw error(400, 'title is required');
	if (!Number.isFinite(groupId)) throw error(400, 'groupId is required');

	// validate group
	const { data: g, error: gErr } = await supabase
		.from('group')
		.select('id')
		.eq('id', groupId)
		.maybeSingle();
	if (gErr) throw error(500, gErr.message);
	if (!g) throw error(404, 'group not found');

	// validate user if provided
	if (assignedUserId != null) {
		if (!Number.isFinite(assignedUserId)) throw error(400, 'invalid assignedUserId');
		const { data: u, error: uErr } = await supabase
			.from('user')
			.select('id')
			.eq('id', assignedUserId)
			.maybeSingle();
		if (uErr) throw error(500, uErr.message);
		if (!u) throw error(404, 'assigned user not found');
		// ensure assigned user is member of the group
		const { data: m, error: mErr } = await supabase
			.from('group_member')
			.select('user_id')
			.eq('group_id', groupId)
			.eq('user_id', assignedUserId)
			.maybeSingle();
		if (mErr) throw error(500, mErr.message);
		if (!m) throw error(400, 'assigned user not in group');
	}

	const emoji = emojiInput ?? (await getEmojiForTitle(title));

	const { data: created, error: cErr } = await supabase
		.from('task')
		.insert({
			title,
			group_id: groupId,
			emoji: emoji ?? null,
			assigned_user_id: assignedUserId ?? null,
			scheduled_at: scheduledAt ?? null,
			recurrence_type: recurrenceType ?? null,
			recurrence_interval: recurrenceInterval ?? null
		})
		.select()
		.single();
	if (cErr) throw error(500, cErr.message);
	return json(created, { status: 201 });
};
