import type { PageServerLoad } from './$types';
import { createSupabaseServer } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals, url, cookies }) => {
	const supabase = createSupabaseServer(cookies);
	if (!locals.user) return { user: null };
	const gid = locals.groupId;
	const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
	const recentSince = Date.now() - threeDaysMs;

	// Mapper functions to transform snake_case to camelCase
	function mapTaskRow(r: any) {
		return {
			id: r.id,
			groupId: r.group_id,
			title: r.title,
			emoji: r.emoji,
			assignedUserId: r.assigned_user_id,
			durationMinutes: r.duration_minutes,
			scheduledAt: r.scheduled_at,
			recurrenceType: r.recurrence_type,
			recurrenceInterval: r.recurrence_interval,
			completedAt: r.completed_at
		};
	}

	function mapUserRow(r: any) {
		return {
			id: r.id,
			name: r.name,
			email: r.email,
			availableTimeMinutesPerWeek: r.available_time_minutes_per_week,
			passwordHash: r.password_hash
		};
	}

	function mapTreatRow(r: any) {
		return {
			id: r.id,
			groupId: r.group_id,
			title: r.title,
			emoji: r.emoji,
			fromUserId: r.from_user_id,
			toUserId: r.to_user_id,
			accepted: r.accepted,
			valueMinutes: r.value_minutes,
			createdAt: r.created_at,
			acceptedAt: r.accepted_at,
			declinedAt: r.declined_at,
			feedbackNote: r.feedback_note,
			acceptedNotifiedAt: r.accepted_notified_at
		};
	}

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
		tasksDone: (tasksDone ?? []).map(mapTaskRow),
		recentTasks: (recentTasks ?? []).map(mapTaskRow),
		recentSince,
		treatsAll: (treatsAll ?? []).map(mapTreatRow),
		users: (users ?? []).map(mapUserRow),
		rangeFrom,
		rangeTo
	};
};
