import type { PageServerLoad } from './$types';
import { createSupabaseServer } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
	if (!locals.user) return { user: null };
	const gid = locals.groupId;
	const supabase = createSupabaseServer(cookies);

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

	let tasks: any[] = [];
	let active: any[] = [];
	let completed: any[] = [];
	let users: any[] = [];
	let pendingTreats: any[] = [];
	let acceptedTreatsToNotify: any[] = [];

	if (gid) {
		const [tAll, tActive, tCompleted, treatsPending, treatsNotify] = await Promise.all([
			supabase.from('task').select('*').eq('group_id', gid),
			supabase.from('task').select('*').eq('group_id', gid).is('completed_at', null),
			supabase
				.from('task')
				.select('*')
				.eq('group_id', gid)
				.not('completed_at', 'is', null)
				.order('completed_at', { ascending: false }),
			supabase
				.from('treat')
				.select('*')
				.eq('group_id', gid)
				.eq('to_user_id', locals.user.id)
				.eq('accepted', false),
			supabase
				.from('treat')
				.select('*')
				.eq('group_id', gid)
				.eq('from_user_id', locals.user.id)
				.eq('accepted', true)
				.is('accepted_notified_at', null)
				.order('accepted_at', { ascending: false })
		]);

		tasks = (tAll.data ?? []).map(mapTaskRow);
		active = (tActive.data ?? []).map(mapTaskRow);
		completed = (tCompleted.data ?? []).map(mapTaskRow);
		pendingTreats = (treatsPending.data ?? []).map(mapTreatRow);
		acceptedTreatsToNotify = (treatsNotify.data ?? []).map(mapTreatRow);
	}

	const usersRes = await supabase.from('user').select('*');
	users = (usersRes.data ?? []).map(mapUserRow);
	return {
		user: locals.user,
		groupId: gid ?? null,
		tasks,
		activeTasks: active,
		completedTasks: completed,
		users,
		pendingTreats,
		acceptedTreatsToNotify,
		showLogin: url.searchParams.get('showLogin') === '1'
	};
};
