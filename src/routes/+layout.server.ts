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
		const youId = locals.user.id;

		// Get ALL tasks in the group (both completed and open)
		const { data: allTasks } = await supabase.from('task').select('*').eq('group_id', gid);

		// Get completed tasks in range
		const { data: completedTasksInRange } = await supabase
			.from('task')
			.select('*')
			.eq('group_id', gid)
			.not('completed_at', 'is', null)
			.gte('completed_at', from)
			.lte('completed_at', now);

		// Get all treats in the group (accepted only)
		const { data: treats } = await supabase
			.from('treat')
			.select('*')
			.eq('group_id', gid)
			.eq('accepted', true);

		// Calculate total expected work (all tasks, regardless of completion)
		const totalExpectedMinutes = (allTasks ?? []).reduce(
			(acc: number, t: any) => acc + (Number(t?.duration_minutes ?? 0) || 0),
			0
		);

		// Calculate completed work by you (in range)
		const youCompletedMinutes = (completedTasksInRange ?? [])
			.filter((t: any) => t.assigned_user_id === youId)
			.reduce((acc: number, t: any) => acc + (Number(t?.duration_minutes ?? 0) || 0), 0);

		// Calculate completed work by others (in range)
		const othersCompletedMinutes = (completedTasksInRange ?? [])
			.filter((t: any) => t.assigned_user_id !== youId)
			.reduce((acc: number, t: any) => acc + (Number(t?.duration_minutes ?? 0) || 0), 0);

		// Add treats to work contribution
		// Treats you gave = extra work you did for others
		// Treats you received = work done for you by others
		const yourTreatsGiven = (treats ?? [])
			.filter((tr: any) => tr.from_user_id === youId)
			.reduce((acc: number, tr: any) => acc + (Number(tr?.value_minutes ?? 0) || 0), 0);
		const yourTreatsReceived = (treats ?? [])
			.filter((tr: any) => tr.to_user_id === youId)
			.reduce((acc: number, tr: any) => acc + (Number(tr?.value_minutes ?? 0) || 0), 0);

		const othersTreatsGiven = (treats ?? [])
			.filter((tr: any) => tr.from_user_id !== youId)
			.reduce((acc: number, tr: any) => acc + (Number(tr?.value_minutes ?? 0) || 0), 0);
		const othersTreatsReceived = (treats ?? [])
			.filter((tr: any) => tr.to_user_id !== youId)
			.reduce((acc: number, tr: any) => acc + (Number(tr?.value_minutes ?? 0) || 0), 0);

		// Net contribution including treats
		const yourTotalContribution = youCompletedMinutes + yourTreatsGiven - yourTreatsReceived;
		const othersTotalContribution =
			othersCompletedMinutes + othersTreatsGiven - othersTreatsReceived;

		// Get user availability info
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
			) || 1; // Default to 1 to avoid division by zero
		const othersAvail =
			(groupUsers as any[])
				.filter((u: any) => u.id !== youId)
				.reduce(
					(acc: number, u: any) => acc + (Number(u?.available_time_minutes_per_week ?? 0) || 0),
					0
				) || 1; // Default to 1 to avoid division by zero

		const totalAvail = youAvail + othersAvail;

		// Calculate what fraction of total expected work is completed
		const totalCompleted = yourTotalContribution + othersTotalContribution;
		const completionRatio = totalExpectedMinutes > 0 ? totalCompleted / totalExpectedMinutes : 0;

		// Normalize contributions by available time to get relative effort
		const yourNormalizedEffort = yourTotalContribution / youAvail;
		const othersNormalizedEffort = othersTotalContribution / othersAvail;
		const totalNormalizedEffort = yourNormalizedEffort + othersNormalizedEffort;

		// Calculate percentages:
		// - Scale by completion ratio so that incomplete work shows empty space
		// - Split based on relative effort (normalized by availability)
		if (totalNormalizedEffort > 0) {
			const yourShare = yourNormalizedEffort / totalNormalizedEffort;
			const othersShare = othersNormalizedEffort / totalNormalizedEffort;

			// Scale both by completion ratio, then by 100 to get percentage
			adjustedPercentages = [
				Math.round(yourShare * completionRatio * 100),
				Math.round(othersShare * completionRatio * 100)
			];
		} else {
			adjustedPercentages = [0, 0];
		}
	}

	return {
		user: locals.user,
		groupId: locals.groupId,
		activeGroup,
		globalAdjustedPercentages: adjustedPercentages,
		rangeDays
	};
};
