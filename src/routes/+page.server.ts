import type { PageServerLoad } from './$types';
import { createSupabaseServer } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals, cookies, url, depends }) => {
	depends('supabase:auth');
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
			completedAt: r.completed_at,
			description: r.description
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
	let outgoingPendingTreats: any[] = [];

	if (gid) {
		const [tAll, tActive, tCompleted, treatsPending, treatsNotify, treatsSentPending] =
			await Promise.all([
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
					.eq('accepted', false)
					.is('declined_at', null),
				supabase
					.from('treat')
					.select('*')
					.eq('group_id', gid)
					.eq('from_user_id', locals.user.id)
					.eq('accepted', true)
					.is('accepted_notified_at', null)
					.order('accepted_at', { ascending: false }),
				supabase
					.from('treat')
					.select('*')
					.eq('group_id', gid)
					.eq('from_user_id', locals.user.id)
					.eq('accepted', false)
					.is('declined_at', null)
					.order('created_at', { ascending: false })
			]);

		tasks = (tAll.data ?? []).map(mapTaskRow);
		active = (tActive.data ?? []).map(mapTaskRow);
		completed = (tCompleted.data ?? []).map(mapTaskRow);
		pendingTreats = (treatsPending.data ?? []).map(mapTreatRow);
		acceptedTreatsToNotify = (treatsNotify.data ?? []).map(mapTreatRow);
		outgoingPendingTreats = (treatsSentPending.data ?? []).map(mapTreatRow);

		// Attach subtasks to tasks
		const allTaskIds = Array.from(
			new Set([
				...tasks.map((t) => t.id),
				...active.map((t) => t.id),
				...completed.map((t) => t.id)
			])
		);
		if (allTaskIds.length > 0) {
			const { data: subtasksRows } = await supabase
				.from('subtask')
				.select('*')
				.in('task_id', allTaskIds)
				.order('order_number', { ascending: true });
			const byTask = new Map<number, any[]>();
			for (const st of subtasksRows ?? []) {
				const camel = {
					id: st.id,
					taskId: st.task_id,
					title: st.title,
					orderNumber: st.order_number,
					completed: st.completed
				};
				if (!byTask.has(st.task_id)) byTask.set(st.task_id, []);
				byTask.get(st.task_id)!.push(camel);
			}
			for (const t of tasks) (t as any).subtasks = byTask.get(t.id) ?? [];
			for (const t of active) (t as any).subtasks = byTask.get(t.id) ?? [];
			for (const t of completed) (t as any).subtasks = byTask.get(t.id) ?? [];
		}
	}

	// Only include users who are members of the current group
	if (gid) {
		const { data: members, error: mErr } = await supabase
			.from('group_member')
			.select('user: user (id, name, email, available_time_minutes_per_week, password_hash)')
			.eq('group_id', gid);
		if (!mErr) {
			users = (members ?? [])
				.map((row: any) => row.user)
				.filter((u: any) => !!u)
				.map(mapUserRow);
		}
	} else {
		users = [];
	}
	return {
		user: locals.user,
		groupId: gid ?? null,
		tasks,
		activeTasks: active,
		completedTasks: completed,
		users,
		pendingTreats,
		acceptedTreatsToNotify,
		outgoingPendingTreats,
		showLogin: url.searchParams.get('showLogin') === '1'
	};
};
