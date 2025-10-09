import type { LayoutServerLoad } from './$types';
import { createSupabaseServer } from '$lib/server/supabase';

export const load: LayoutServerLoad = async ({ locals, url, cookies }) => {
	const supabase = createSupabaseServer(cookies);
	let activeGroup: { id: number; title: string } | null = null;
	const gid = locals.groupId;
	if (locals.user && gid) {
		const { data: g } = await supabase.from('group').select('id,title').eq('id', gid).maybeSingle();
		activeGroup = (g as any) ?? null;
	}

	// Global availability-adjusted percentages over a range (7 or 30 days)
	let adjustedPercentages: [number, number] = [0, 0];
	let rangeDays = 7;
	if (locals.user && gid) {
		const r = Number(url.searchParams.get('range'));
		rangeDays = r === 30 ? 30 : 7;
		const now = Date.now();
		const from = now - rangeDays * 24 * 60 * 60 * 1000;

		const { data: tasksInRange } = await supabase
			.from('task')
			.select('*')
			.eq('group_id', gid)
			.not('completed_at', 'is', null)
			.gte('completed_at', from)
			.lte('completed_at', now);

		const youId = locals.user.id;
		const youMinutes = (tasksInRange as any[])
			.filter((t: any) => t.assigned_user_id === youId)
			.reduce((acc: number, t: any) => acc + (Number(t?.duration_minutes ?? 0) || 0), 0);
		const othersMinutes = (tasksInRange as any[])
			.filter((t: any) => t.assigned_user_id == null || t.assigned_user_id !== youId)
			.reduce((acc: number, t: any) => acc + (Number(t?.duration_minutes ?? 0) || 0), 0);

		// Availability sums
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
		adjustedPercentages = [yourAdjPercent, 100 - yourAdjPercent];
	}

	return {
		user: locals.user,
		groupId: locals.groupId,
		activeGroup,
		globalAdjustedPercentages: adjustedPercentages,
		rangeDays
	};
};
