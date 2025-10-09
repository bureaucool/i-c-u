import type { PageServerLoad } from './$types';
import { createSupabaseServer } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals, url, cookies }) => {
	const supabase = createSupabaseServer(cookies);
	if (!locals.user) return { user: null };
	const gid = locals.groupId;
	const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
	const recentSince = Date.now() - threeDaysMs;

	// Flexible range: parse from/to (ms timestamps). Defaults to last 30 days
	const now = Date.now();
	const defaultFrom = now - 30 * 24 * 60 * 60 * 1000;
	const parseTs = (v: string | null): number | null => {
		if (!v) return null;
		const n = Number(v);
		if (Number.isFinite(n)) return n;
		const d = Date.parse(v);
		return Number.isFinite(d) ? d : null;
	};
	const rangeFrom = parseTs(url.searchParams.get('from')) ?? defaultFrom;
	const rangeTo = parseTs(url.searchParams.get('to')) ?? now;

	const { data: tasksDone } = gid
		? await supabase
				.from('task')
				.select('*')
				.eq('group_id', gid)
				.not('completed_at', 'is', null)
				.gte('completed_at', rangeFrom)
				.lte('completed_at', rangeTo)
				.order('completed_at', { ascending: false })
		: ({ data: [] } as any);

	const { data: recentTasks } = gid
		? await supabase
				.from('task')
				.select('*')
				.eq('group_id', gid)
				.not('completed_at', 'is', null)
				.gte('completed_at', recentSince)
				.order('completed_at', { ascending: false })
		: ({ data: [] } as any);

	const { data: treatsAll } = gid
		? await supabase.from('treat').select('*').eq('group_id', gid)
		: ({ data: [] } as any);
	const { data: memberships } = gid
		? await supabase.from('group_member').select('user_id').eq('group_id', gid)
		: ({ data: [] } as any);
	const memberIds = (memberships ?? []).map((m: any) => m.user_id);
	const { data: users } = memberIds.length
		? await supabase.from('user').select('*').in('id', memberIds)
		: ({ data: [] } as any);
	return {
		user: locals.user,
		groupId: gid,
		tasksDone: tasksDone ?? [],
		recentTasks: recentTasks ?? [],
		recentSince,
		treatsAll: treatsAll ?? [],
		users: users ?? [],
		rangeFrom,
		rangeTo
	};
};
