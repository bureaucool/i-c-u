import type { RequestHandler } from './$types';
import { createSupabaseServer } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ locals, url, cookies }) => {
	const supabase = createSupabaseServer(cookies);
	if (!locals.user || !locals.groupId)
		return new Response(JSON.stringify({ percentages: [0, 0] }), { status: 200 });
	const gid = locals.groupId;
	const youId = locals.user.id;
	const r = Number(url.searchParams.get('range'));
	const rangeDays = r === 30 ? 30 : 7;
	const now = Date.now();
	const from = now - rangeDays * 24 * 60 * 60 * 1000;

	const { data: tasksInRange } = await supabase
		.from('task')
		.select('*')
		.eq('group_id', gid)
		.not('completed_at', 'is', null)
		.gte('completed_at', from)
		.lte('completed_at', now);

	const youMinutes = tasksInRange
		.filter((t) => t.assignedUserId === youId)
		.reduce((acc, t) => acc + (Number((t as any).durationMinutes ?? 0) || 0), 0);
	const othersMinutes = tasksInRange
		.filter((t) => t.assignedUserId == null || t.assignedUserId !== youId)
		.reduce((acc, t) => acc + (Number((t as any).durationMinutes ?? 0) || 0), 0);

	const { data: memberIds } = await supabase
		.from('group_member')
		.select('user_id')
		.eq('group_id', gid);
	const ids = (memberIds ?? []).map((m: any) => m.user_id);
	const { data: groupUsers } = ids.length
		? await supabase.from('user').select('*').in('id', ids)
		: ({ data: [] } as any);

	const youAvail =
		Number(
			(groupUsers as any[]).find((u: any) => u.id === youId)?.available_time_minutes_per_week ?? 0
		) || 0;
	const othersAvail = (groupUsers as any[])
		.filter((u: any) => u.id !== youId)
		.reduce(
			(acc: number, u: any) => acc + (Number(u?.available_time_minutes_per_week ?? 0) || 0),
			0
		);

	const youNorm = youAvail > 0 ? youMinutes / youAvail : 0;
	const othersNorm = othersAvail > 0 ? othersMinutes / othersAvail : 0;
	const normSum = youNorm + othersNorm;
	const yourAdjPercent = normSum ? Math.round((youNorm / normSum) * 100) : 0;
	const percentages = [yourAdjPercent, 100 - yourAdjPercent] as [number, number];

	return new Response(JSON.stringify({ percentages }), {
		status: 200,
		headers: { 'content-type': 'application/json' }
	});
};
