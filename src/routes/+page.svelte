<script lang="ts">
	import type { Task, User } from '$lib/types';
	import TaskDialog from '$lib/components/task-dialog.svelte';
	import TreatDialog from '$lib/components/treat-dialog.svelte';
	import { invalidateAll, goto } from '$app/navigation';
	import Button from '$lib/components/button.svelte';
	import AcceptTreat from '$lib/components/accept-treat.svelte';
	import Floating from '$lib/components/floating.svelte';
	import { expoOut, sineInOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';

	import Portal from 'svelte-portal';
	import { onMount, onDestroy } from 'svelte';
	import { createSupabaseBrowser } from '$lib/supabaseClient';
	import Fireworks from '$lib/components/fireworks.svelte';
	import { addNotification, addNotificationBig } from '$lib/stores/notifications';
	import TaskList from '$lib/components/task-list.svelte';
	import TreatAccepted from '$lib/components/treat-accepted.svelte';
	import RotatingContainer from '$lib/components/rotating-container.svelte';
	import MiniTag from '$lib/components/mini-tag.svelte';
	import IconRemove from '$lib/components/icon-remove.svelte';

	let {
		data
	}: {
		data: {
			user?: { id: number; name: string } | null;
			tasks?: Task[];
			activeTasks?: Task[];
			completedTasks?: Task[];
			users?: User[];
			pendingTreats?: import('$lib/types').Treat[];
			groupId?: number | null;
		};
	} = $props();

	// Local task state for optimistic updates
	let localActiveTasks = $state<Task[]>([...(data.activeTasks ?? data.tasks ?? [])]);
	let localCompletedTasks = $state<Task[]>([...(data.completedTasks ?? [])]);
	let localPendingTreats = $state<Array<any>>([...(data.pendingTreats ?? [])]);
	let outgoingPendingTreats = $state<Array<any>>([...((data as any).outgoingPendingTreats ?? [])]);

	// Sync local state when server data changes (e.g., after login/invalidation)
	$effect(() => {
		// Only update if we have data (user is logged in)
		if (data.activeTasks || data.tasks) {
			localActiveTasks = [...(data.activeTasks ?? data.tasks ?? [])];
		}
		if (data.completedTasks) {
			localCompletedTasks = [...(data.completedTasks ?? [])];
		}
		if (data.pendingTreats) {
			localPendingTreats = [...(data.pendingTreats ?? [])];
		}
		if ((data as any).outgoingPendingTreats) {
			outgoingPendingTreats = [...((data as any).outgoingPendingTreats ?? [])];
		}
	});

	function mapTaskRowClient(r: any): Task {
		return {
			id: r.id,
			title: r.title,
			emoji: r.emoji,
			assignedUserId: r.assigned_user_id,
			durationMinutes: r.duration_minutes,
			scheduledAt: r.scheduled_at,
			recurrenceType: r.recurrence_type,
			recurrenceInterval: r.recurrence_interval,
			completedAt: r.completed_at,
			description: r.description,
			subtasks: (r.subtasks ?? []).map((st: any) => ({
				id: st.id,
				taskId: st.taskId ?? st.task_id,
				title: st.title,
				orderNumber: st.orderNumber ?? st.order_number,
				completed: st.completed
			}))
		};
	}

	function upsertTaskLocal(updatedRaw: any) {
		const updated = mapTaskRowClient(updatedRaw);
		const isCompleted = updated.completedAt != null;
		// Remove from both lists first
		localActiveTasks = localActiveTasks.filter((t) => t.id !== updated.id);
		localCompletedTasks = localCompletedTasks.filter((t) => t.id !== updated.id);
		// Insert into the correct list
		if (isCompleted) {
			localCompletedTasks = [updated, ...localCompletedTasks];
		} else {
			localActiveTasks = [updated, ...localActiveTasks];
		}
	}

	function removeTaskLocal(taskId: number) {
		localActiveTasks = localActiveTasks.filter((t) => t.id !== taskId);
		localCompletedTasks = localCompletedTasks.filter((t) => t.id !== taskId);
	}

	// Realtime subscription to keep tasks/subtasks in sync with DB
	let taskChannel: any = null;

	function mapTaskFromDbRow(r: any): Task {
		const existing = findTaskLocal(r.id);
		return {
			id: r.id,
			title: r.title,
			emoji: r.emoji,
			assignedUserId: r.assigned_user_id ?? null,
			durationMinutes: r.duration_minutes ?? null,
			scheduledAt: r.scheduled_at ?? null,
			recurrenceType: r.recurrence_type ?? null,
			recurrenceInterval: r.recurrence_interval ?? null,
			completedAt: r.completed_at ?? null,
			description: r.description ?? null,
			subtasks: existing?.subtasks ?? []
		};
	}

	function findTaskLocal(taskId: number): Task | undefined {
		return (
			localActiveTasks.find((t) => t.id === taskId) ||
			localCompletedTasks.find((t) => t.id === taskId)
		);
	}

	function insertOrUpdateTaskFromDb(row: any) {
		const mapped = mapTaskFromDbRow(row);
		// Remove from both lists
		localActiveTasks = localActiveTasks.filter((t) => t.id !== mapped.id);
		localCompletedTasks = localCompletedTasks.filter((t) => t.id !== mapped.id);
		// Add to correct list
		if (mapped.completedAt != null) {
			localCompletedTasks = [mapped, ...localCompletedTasks];
		} else {
			localActiveTasks = [mapped, ...localActiveTasks];
		}
	}

	function updateSubtaskLocal(evType: 'INSERT' | 'UPDATE' | 'DELETE', row: any) {
		const taskId = row.task_id ?? row.taskId;
		const mapSub = (r: any) => ({
			id: r.id,
			taskId: r.task_id ?? r.taskId,
			title: r.title,
			orderNumber: r.order_number ?? r.orderNumber,
			completed: r.completed
		});
		const updater = (t: Task) => {
			const current = t.subtasks ?? [];
			if (evType === 'DELETE') {
				return { ...t, subtasks: current.filter((s) => s.id !== row.id) } as Task;
			}
			const updated = mapSub(row);
			let next = current.map((s) => (s.id === updated.id ? { ...s, ...updated } : s));
			if (!current.some((s) => s.id === updated.id)) {
				next = [...current, updated];
			}
			// keep order if orderNumber present
			next = next.slice().sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0));
			return { ...t, subtasks: next } as Task;
		};
		localActiveTasks = localActiveTasks.map((t) => (t.id === taskId ? updater(t) : t));
		localCompletedTasks = localCompletedTasks.map((t) => (t.id === taskId ? updater(t) : t));
	}

	function mapTreatFromDbRow(r: any) {
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

	function upsertOrRemovePendingTreat(row: any, eventType: 'INSERT' | 'UPDATE' | 'DELETE') {
		const id = row.id;
		// remove first
		localPendingTreats = (localPendingTreats ?? []).filter((t) => t.id !== id);
		if (eventType === 'DELETE') return;
		const isPending =
			row.to_user_id === (data.user?.id ?? -1) && row.accepted === false && row.declined_at == null;
		if (isPending) {
			localPendingTreats = [mapTreatFromDbRow(row), ...localPendingTreats];
		}
	}

	function upsertOrRemoveAcceptedNotice(row: any, eventType: 'INSERT' | 'UPDATE' | 'DELETE') {
		const id = row.id;
		acceptedNotices = (acceptedNotices ?? []).filter((t) => t.id !== id);
		if (eventType === 'DELETE') return;
		const shouldShow =
			row.from_user_id === (data.user?.id ?? -1) &&
			row.accepted === true &&
			row.accepted_notified_at == null;
		if (shouldShow) {
			acceptedNotices = [mapTreatFromDbRow(row), ...acceptedNotices];
		}
	}

	function upsertOrRemoveOutgoingPending(row: any, eventType: 'INSERT' | 'UPDATE' | 'DELETE') {
		const id = row.id;
		outgoingPendingTreats = (outgoingPendingTreats ?? []).filter((t) => t.id !== id);
		if (eventType === 'DELETE') return;
		const isPending =
			row.from_user_id === (data.user?.id ?? -1) &&
			row.accepted === false &&
			row.declined_at == null;
		if (isPending) {
			outgoingPendingTreats = [mapTreatFromDbRow(row), ...outgoingPendingTreats];
		}
	}

	onMount(() => {
		if (!data.groupId) return;
		const supabase = createSupabaseBrowser();
		const channelName = `tasks-${data.groupId}`;
		const channel = supabase.channel(channelName);
		channel.on(
			'postgres_changes',
			{ event: '*', schema: 'public', table: 'task' },
			(payload: any) => {
				// Client-side group filter
				const groupId = (payload.new as any)?.group_id || (payload.old as any)?.group_id;
				if (groupId !== data.groupId) return;
				console.debug('[realtime] page task event', {
					channel: channelName,
					status: 'event',
					eventType: payload.eventType,
					new: payload.new,
					old: payload.old
				});
				if (payload.eventType === 'DELETE') {
					removeTaskLocal(payload.old.id);
				} else {
					insertOrUpdateTaskFromDb(payload.new);
				}
			}
		);
		channel.on(
			'postgres_changes',
			{ event: '*', schema: 'public', table: 'subtask' },
			(payload: any) => {
				console.debug('[realtime] page subtask event', {
					channel: channelName,
					status: 'event',
					eventType: payload.eventType,
					new: payload.new,
					old: payload.old
				});
				if (payload.eventType === 'DELETE') updateSubtaskLocal('DELETE', payload.old);
				else updateSubtaskLocal(payload.eventType, payload.new);
			}
		);
		channel.on(
			'postgres_changes',
			{ event: '*', schema: 'public', table: 'treat' },
			(payload: any) => {
				// Client-side group filter
				const groupId = (payload.new as any)?.group_id || (payload.old as any)?.group_id;
				if (groupId !== data.groupId) return;
				console.debug('[realtime] page treat event', {
					channel: channelName,
					status: 'event',
					eventType: payload.eventType,
					new: payload.new,
					old: payload.old
				});
				if (payload.eventType === 'DELETE') {
					upsertOrRemovePendingTreat(payload.old, 'DELETE');
					upsertOrRemoveAcceptedNotice(payload.old, 'DELETE');
					upsertOrRemoveOutgoingPending(payload.old, 'DELETE');
				} else {
					upsertOrRemovePendingTreat(payload.new, payload.eventType);
					upsertOrRemoveAcceptedNotice(payload.new, payload.eventType);
					upsertOrRemoveOutgoingPending(payload.new, payload.eventType);
				}
			}
		);
		channel.subscribe((status) => {
			console.debug('[realtime] page channel status', { channel: channelName, status });
		});
		taskChannel = channel;
	});

	onDestroy(() => {
		taskChannel?.unsubscribe?.();
	});

	let showAdd = $state(false);
	let formType: 'task' | 'treat' = $state('task');

	// Floating treat accept flow state
	let acceptingTreatId: number | null = $state(null);

	let listOpen = $state<boolean>(false);

	// One-time acceptance notification (for creator) - reactive to data changes
	let acceptedNotices = $state<Array<any>>([...((data as any).acceptedTreatsToNotify ?? [])]);

	// Sync acceptedNotices when data changes
	$effect(() => {
		if ((data as any).acceptedTreatsToNotify) {
			acceptedNotices = [...((data as any).acceptedTreatsToNotify ?? [])];
		}
	});

	async function acknowledgeAccepted(id: number) {
		await fetch(`/api/treats/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ acknowledgeAccepted: true })
		});
		acceptedNotices = acceptedNotices.filter((t) => t.id !== id);
	}

	let loginOpen = $state(false);
	let signupOpen = $state(false);
	let resetOpen = $state(false);
	let submitting = $state(false);
	let loggingIn = $state(false);

	$effect(() => {
		if (!showAdd) {
			formType = 'task';
		}
	});

	// Auto-open login from confirmation redirect
	$effect(() => {
		if ((data as any).showLogin) {
			loginOpen = true;
		}
	});

	// Overlays for complete/edit
	let completeOpen = $state(false);
	let editOpen = $state(false);
	let completedOptionsOpen = $state(false);
	let selectedTask: Task | null = $state(null);
	let completeMinutes = $state<number | null>(null);
	// Edit state (reuses add fields)
	let editTitle = $state<string>('');
	let editEmoji = $state<string>('');
	let editAssignedUserId = $state<string>('');
	let editDate = $state<string>('');
	let editTime = $state<string>('');
	let editRecurrenceType = $state<string>('');
	let editRecurrenceInterval = $state<string>('');

	const now = new Date();
	const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

	const tasksToday = $derived(
		(localActiveTasks ?? []).filter((t) => {
			const ts = Number(t.scheduledAt ?? 0);
			return ts >= startOfDay && ts <= endOfDay;
		})
	);
	const tasksUpcoming = $derived(
		(localActiveTasks ?? []).filter((t) => {
			const ts = Number(t.scheduledAt ?? 0);
			return ts > endOfDay;
		})
	);
	const tasksNoDate = $derived(
		(localActiveTasks ?? []).filter((t) => {
			const ts = t.scheduledAt;
			return ts == null || Number(ts) < startOfDay; // include overdue
		})
	);

	function openComplete(t: Task) {
		selectedTask = t;
		completeMinutes = Number((t as any).durationMinutes ?? '') || null;
		completeOpen = true;
	}

	function openEdit(t: Task) {
		showAdd = true;
		selectedTask = t;
		editTitle = t.title ?? '';
		editEmoji = (t.emoji ?? '') as string;
		editAssignedUserId = t.assignedUserId ? String(t.assignedUserId) : '';
		if (t.scheduledAt) {
			const d = new Date(Number(t.scheduledAt));
			editDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			editTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
		} else {
			editDate = '';
			editTime = '';
		}
		editRecurrenceType = ((t as any).recurrenceType ?? '') as string;
		editRecurrenceInterval =
			((t as any).recurrenceInterval ?? '') ? String((t as any).recurrenceInterval) : '';
		editOpen = true;
	}

	async function onDelete(t: Task) {
		if (!t) return;
		const res = await fetch(`/api/tasks/${t.id}`, { method: 'DELETE' });
		if (res.ok) {
			// Optimistic removal; realtime will also arrive (idempotent)
			removeTaskLocal(t.id);
		}
	}
	// Helper to display user names for treats
	function getUserName(userId: number | null | undefined): string {
		const u = (data.users ?? []).find((usr) => usr.id === Number(userId));
		return u?.name ?? String(userId ?? '');
	}
</script>

<div
	class="pointer-events-none fixed inset-x-0 top-3 z-40 mx-auto flex max-w-lg flex-row justify-between"
>
	{#if data.user}
		<a class="pointer-events-auto p-3" href="/">Insights</a>
		<a href="/settings" aria-label="Settings" class="pointer-events-auto p-3">Settings</a>
	{/if}
</div>

{#if !data.user}
	<section class="flex h-full w-full flex-col items-center justify-center gap-y-5 text-center">
		<h2 class="font-script text-6xl">I c u</h2>
		<p class="leading-tight">
			Collaborative task manager,<br />focused on appreciation and balance
		</p>
	</section>

	{#if loginOpen}
		<div
			class="fixed inset-0 z-10 h-full w-full"
			role="button"
			tabindex="0"
			aria-label="Close login dialog"
			onclick={() => {
				loginOpen = false;
				signupOpen = false;
				resetOpen = false;
				listOpen = false;
			}}
			onkeydown={(e) => (e.key === 'Escape' ? (loginOpen = false) : null)}
		></div>
		<div class="fixed inset-x-3 top-3 z-20 flex justify-center">
			<div class="flex w-60 flex-col gap-y-2 rounded-xl bg-white p-3">
				<form
					class="flex flex-col gap-y-2"
					onsubmit={async (e) => {
						e.preventDefault();
						if (submitting) return;
						submitting = true;
						loggingIn = true;

						const form = new FormData(e.currentTarget as HTMLFormElement);
						const body = Object.fromEntries(form.entries());
						const res = await fetch('/api/auth', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify(body)
						});
						if (res.ok) {
							// Invalidate all server data to reload with new auth context
							await invalidateAll();
							loginOpen = false;
							submitting = false;
							loggingIn = false;
						} else {
							const err = await res.json().catch(() => ({}));
							addNotification({
								id: Date.now().toString(),
								createdAt: Date.now(),
								message: err?.error || err?.message || 'Login failed',
								type: 'error'
							});
							submitting = false;
							loggingIn = false;
						}
					}}
				>
					<input name="email" type="email" placeholder="Email" required />
					<input name="password" type="password" placeholder="Password" required />
					<Button big={false} type="submit" disabled={submitting}>Log in</Button>
				</form>
			</div>
		</div>
	{:else if signupOpen}
		<div
			class="fixed inset-0 z-10 h-full w-full"
			role="button"
			tabindex="0"
			aria-label="Close signup dialog"
			onclick={() => {
				loginOpen = false;
				signupOpen = false;
				resetOpen = false;
				listOpen = false;
			}}
			onkeydown={(e) => (e.key === 'Escape' ? (signupOpen = false) : null)}
		></div>
		<div class="fixed inset-x-3 top-3 z-20 flex justify-center">
			<div class="flex w-60 flex-col gap-y-2 rounded-xl bg-white p-3">
				<form
					class="flex flex-col gap-y-2"
					onsubmit={async (e) => {
						if (submitting) return;
						e.preventDefault();
						submitting = true;

						const form = new FormData(e.currentTarget as HTMLFormElement);
						const body = Object.fromEntries(form.entries());
						const password = String((body as any).password ?? '');
						const confirm = String((body as any).confirmPassword ?? '');
						if (password.length < 8) {
							addNotification({
								id: Date.now().toString(),
								createdAt: Date.now(),
								message: 'Password must be at least 8 characters',
								type: 'error'
							});
							return;
						}
						if (password !== confirm) {
							addNotification({
								id: Date.now().toString(),
								createdAt: Date.now(),
								message: 'Passwords do not match',
								type: 'error'
							});
							return;
						}
						const res = await fetch('/api/auth/signup', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify(body)
						});
						if (res.ok) {
							addNotification({
								id: Date.now().toString(),
								createdAt: Date.now(),
								message: 'Signed up. Check your email if confirmation is required, then log in.',
								type: 'success'
							});
							submitting = false;
						} else {
							const err = await res.json().catch(() => ({}));
							addNotification({
								id: Date.now().toString(),
								createdAt: Date.now(),
								message: err?.error || err?.message || 'Sign up failed',
								type: 'error'
							});
							submitting = false;
						}
					}}
				>
					<input name="name" type="text" placeholder="Name" />
					<input name="email" type="email" placeholder="Email" required />
					<input
						name="password"
						type="password"
						placeholder="Password (min 8 chars)"
						minlength="8"
						required
					/>
					<input
						name="confirmPassword"
						type="password"
						placeholder="Confirm password"
						minlength="8"
						required
					/>
					<Button big={false} type="submit" disabled={submitting}>Sign up</Button>
				</form>
			</div>
		</div>
	{:else if resetOpen}
		<div
			class="fixed inset-0 z-10 h-full w-full"
			role="button"
			tabindex="0"
			aria-label="Close reset dialog"
			onclick={() => {
				loginOpen = false;
				signupOpen = false;
				resetOpen = false;
				listOpen = false;
			}}
			onkeydown={(e) => (e.key === 'Escape' ? (resetOpen = false) : null)}
		></div>
		<div class="fixed inset-x-3 top-3 z-20 flex justify-center">
			<div class="flex w-60 flex-col gap-y-2 rounded-xl bg-white p-3">
				<form
					class="flex flex-col gap-y-2"
					onsubmit={async (e) => {
						if (submitting) return;
						e.preventDefault();
						submitting = true;

						const form = new FormData(e.currentTarget as HTMLFormElement);
						const body = Object.fromEntries(form.entries());
						const res = await fetch('/api/auth/reset', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify(body)
						});
						submitting = false;
						if (res.ok) {
							addNotification({
								id: Date.now().toString(),
								createdAt: Date.now(),
								message: 'If the email exists, a reset link was sent.',
								type: 'success'
							});
						} else {
							const err = await res.json().catch(() => ({}));
							addNotification({
								id: Date.now().toString(),
								createdAt: Date.now(),
								message: err?.error || err?.message || 'Failed to send reset email',
								type: 'error'
							});
						}
					}}
				>
					<input name="email" type="email" placeholder="Email" required />
					<Button big={false} type="submit" disabled={submitting}>Send reset link</Button>
				</form>
			</div>
		</div>
	{:else if listOpen}
		<div
			class="fixed inset-0 z-10 h-full w-full"
			role="button"
			tabindex="0"
			aria-label="Close reset dialog"
			onclick={() => {
				loginOpen = false;
				signupOpen = false;
				resetOpen = false;
				listOpen = false;
			}}
			onkeydown={(e) => (e.key === 'Escape' ? (resetOpen = false) : null)}
		></div>
		<div class="pointer-events-none fixed inset-0 top-3 z-40">
			<div class="item-end mx-auto flex w-60 flex-col gap-y-0.5 px-7">
				<Button big={false} onclick={() => (loginOpen = true)}>Log in</Button>
				<Button big={false} onclick={() => (signupOpen = true)}>Sign up</Button>

				<Button grey big={false} onclick={() => (resetOpen = true)}>Reset password</Button>
			</div>
		</div>
	{:else}
		<div class="pointer-events-none fixed inset-x-0 top-3 z-40 mx-auto flex w-full max-w-lg">
			<div class="mx-auto flex max-w-xl justify-end px-7">
				<span onclick={() => (listOpen = true)} class="pointer-events-auto p-3">Account</span>
			</div>
		</div>
	{/if}
{:else}
	<section class="relative flex flex-col gap-y-10">
		{#if !data.groupId}
			<div class="rounded-xl bg-white p-4">
				<h3 class="mb-2 text-xl">Create your first group</h3>
				<form
					class="flex flex-row gap-x-2"
					onsubmit={async (e) => {
						e.preventDefault();
						const form = new FormData(e.currentTarget as HTMLFormElement);
						const res = await fetch('/api/groups', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ title: String(form.get('title') ?? '').trim() })
						});
						if (res.ok) {
							await invalidateAll();
							addNotification({
								id: Date.now().toString(),
								createdAt: Date.now(),
								message: 'Group created',
								type: 'success'
							});
						}
					}}
				>
					<input name="title" type="text" placeholder="Group title" required />
					<button type="submit">Create</button>
				</form>
			</div>
		{:else}
			{#if (acceptedNotices ?? []).length > 0}
				{#each acceptedNotices as tr}
					<Floating classes="z-50">
						<TreatAccepted {tr} {acknowledgeAccepted} />
					</Floating>
				{/each}
			{/if}

			<TaskList
				title="Today"
				tasks={tasksToday}
				userId={data.user?.id ?? -1}
				{openComplete}
				{openEdit}
				{onDelete}
			/>
			<TaskList
				title="Upcoming"
				tasks={tasksUpcoming}
				userId={data.user?.id ?? -1}
				{openComplete}
				{openEdit}
				{onDelete}
			/>

			<TaskList
				title="Whenever"
				tasks={tasksNoDate}
				userId={data.user?.id ?? -1}
				{openComplete}
				{openEdit}
				{onDelete}
			/>

			<TaskList
				title="Completed"
				tasks={localCompletedTasks ?? []}
				limit={10}
				userId={data.user?.id ?? -1}
				hideUser={true}
				{openComplete}
				{openEdit}
				{onDelete}
			/>

			{#if (outgoingPendingTreats ?? []).length > 0}
				<div class="">
					<h3 class="mb-2 text-neutral-500">Pending treats</h3>
					<ul class="flex flex-col gap-y-1">
						{#each outgoingPendingTreats ?? [] as tr}
							<li
								class="relative flex items-center justify-between gap-x-2 rounded-full border border-neutral-200 px-6 py-4"
							>
								<div class="flex items-center gap-x-2">
									<span class="text-2xl">{tr.emoji ?? '♥️'}</span>
									<div class="flex flex-col">
										<span class="text-3xl">{tr.title}</span>
										<MiniTag big>For {getUserName(tr.toUserId)}</MiniTag>
									</div>

									<!-- <span class="text-neutral-500">({tr.valueMinutes} min)</span> -->
								</div>

								<div
									class="absolute inset-y-0 right-8 z-20 flex flex-col items-center justify-center"
								>
									<button
										class="cursor-pointer text-2xl"
										onclick={async () => {
											await fetch(`/api/treats/${tr.id}`, { method: 'DELETE' });
											outgoingPendingTreats = (outgoingPendingTreats ?? []).filter(
												(t) => t.id !== tr.id
											);
										}}><IconRemove /></button
									>
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		{/if}
	</section>

	<div class="pointer-events-none fixed inset-x-3 bottom-3 flex justify-center">
		<Button
			onclick={() => {
				editOpen = false;
				selectedTask = null;
				showAdd = true;
			}}>+</Button
		>
	</div>
{/if}

<Portal target="body">
	{#if showAdd}
		<div class="fixed inset-0 z-50 overflow-y-auto px-5 md:px-10">
			<button
				aria-label="Close"
				class="fixed inset-0 z-20 bg-black/50"
				onclick={() => (showAdd = false)}
				transition:fade|global={{ duration: 100, easing: sineInOut }}
			></button>
			<div class="flex min-h-full items-center justify-center py-10">
				<div
					class="relative z-30 flex w-full max-w-md flex-col gap-y-6 rounded-4xl bg-black/90 p-5 text-white"
					in:fly={{ duration: 500, easing: expoOut, y: 200 }}
					out:fade={{ duration: 100, easing: sineInOut }}
				>
					{#if !editOpen}
						<div class="flex flex-row justify-center gap-x-4">
							<Button grey={formType === 'task'} onclick={() => (formType = 'task')}>🔨 Task</Button
							>
							<Button grey={formType === 'treat'} onclick={() => (formType = 'treat')}
								>♥️ Treat</Button
							>
						</div>
					{/if}

					{#if formType === 'task'}
						{#if editOpen}
							<TaskDialog
								task={selectedTask}
								users={data.users ?? []}
								extras={(data.tasks ?? [])
									.map((t) => t.emoji)
									.filter((e) => typeof e === 'string') as string[]}
								mode={'edit'}
								allowDelete={true}
								onDuplicate={async () => {
									if (!selectedTask) return;
									const res = await fetch('/api/tasks', {
										method: 'POST',
										headers: { 'Content-Type': 'application/json' },
										body: JSON.stringify({
											title: selectedTask.title,
											emoji: selectedTask.emoji,
											assignedUserId: selectedTask.assignedUserId,
											scheduledAt: selectedTask.scheduledAt ?? null,
											recurrenceType: (selectedTask as any).recurrenceType ?? null,
											recurrenceInterval: (selectedTask as any).recurrenceInterval ?? null,
											description: selectedTask.description ?? null,
											subtasks:
												selectedTask.subtasks?.map((st) => ({
													title: st.title,
													orderNumber: st.orderNumber,
													completed: false // Reset completion status for duplicated task
												})) ?? []
										})
									});
									if (res.ok) {
										const created = await res.json().catch(() => null);
										if (created) upsertTaskLocal(created);
										editOpen = false;
										showAdd = false;
									}
								}}
								onCancel={() => {
									editOpen = false;
									showAdd = false;
								}}
								onSave={async (payload) => {
									let ok = false;
									if (selectedTask) {
										const res = await fetch(`/api/tasks/${selectedTask.id}`, {
											method: 'PATCH',
											headers: { 'Content-Type': 'application/json' },
											body: JSON.stringify(payload)
										});
										ok = res.ok;
									} else {
										const res = await fetch('/api/tasks', {
											method: 'POST',
											headers: { 'Content-Type': 'application/json' },
											body: JSON.stringify(payload)
										});
										ok = res.ok;
									}
									if (ok) {
										editOpen = false;
										showAdd = false;
									}
								}}
								onDelete={async () => {
									if (!selectedTask) return;
									const res = await fetch(`/api/tasks/${selectedTask.id}`, { method: 'DELETE' });
									if (res.ok) {
										editOpen = false;
										showAdd = false;
										invalidateAll();
									}
								}}
							/>
						{:else}
							<TaskDialog
								mode={'create'}
								task={null}
								users={data.users ?? []}
								extras={(data.tasks ?? [])
									.map((t) => t.emoji)
									.filter((e) => typeof e === 'string') as string[]}
								onCancel={() => {
									showAdd = false;
								}}
								onSave={async (payload) => {
									const res = await fetch('/api/tasks', {
										method: 'POST',
										headers: { 'Content-Type': 'application/json' },
										body: JSON.stringify(payload)
									});
									if (res.ok) {
										showAdd = false;
										const created = await res.json().catch(() => null);
										if (created) upsertTaskLocal(created);

										addNotificationBig({
											id: Date.now().toString(),
											message: '⚙️',
											createdAt: Date.now()
										});
									} else {
										addNotification({
											id: Date.now().toString(),
											createdAt: Date.now(),
											message: 'Failed to create task',
											type: 'error'
										});
									}
								}}
							/>
						{/if}
					{:else}
						<TreatDialog
							users={data.users ?? []}
							currentUserId={data.user?.id}
							onCancel={() => {
								showAdd = false;
							}}
							onSave={async (payload) => {
								const res = await fetch('/api/treats', {
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify(payload)
								});
								if (res.ok) {
									showAdd = false;
									addNotificationBig({
										id: Date.now().toString(),
										message: '❤️',
										createdAt: Date.now()
									});
									const created = await res.json().catch(() => null);
									if (created) {
										// Optimistically add to outgoing pending; realtime will confirm
										outgoingPendingTreats = [
											mapTreatFromDbRow(created),
											...(outgoingPendingTreats ?? [])
										];
									}
								} else {
									const err = await res.json().catch(() => ({}));
									addNotification({
										id: Date.now().toString(),
										createdAt: Date.now(),
										message: err?.error || err?.message || 'Failed to create treat',
										type: 'error'
									});
								}
							}}
						/>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	{#if completeOpen && selectedTask}
		<div class="fixed inset-0 z-50 flex items-center justify-center px-10">
			<button
				transition:fade={{ duration: 100, easing: sineInOut }}
				aria-label="Close"
				class="absolute inset-0 bg-white/80"
				onclick={() => (completeOpen = false)}
			></button>

			<div class="pointer-events-none absolute inset-0 z-10">
				<Fireworks />
			</div>
			<div
				class="relative z-20 flex flex-col gap-y-10 rounded-4xl bg-black/90 px-8 py-5 text-white"
				in:fly={{ duration: 500, easing: expoOut, y: 200 }}
				out:fade={{ duration: 100, easing: sineInOut }}
			>
				<h3 class="flex flex-row justify-start gap-x-2 text-center text-3xl">
					<RotatingContainer
						children={[
							`<span class="inline-block pr-1">${selectedTask.emoji}</span>`,
							`<span class="inline-block pr-1">${selectedTask.title}</span>`,
							`<span class="inline-block pr-1 opacity-50">done!</span>`
						]}
					></RotatingContainer>
				</h3>

				<form
					class="flex flex-col gap-y-10"
					onsubmit={async (e) => {
						e.preventDefault();
						if (selectedTask == null) return;
						const res = await fetch(`/api/tasks/${selectedTask.id}`, {
							method: 'PATCH',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								durationMinutes: Number(completeMinutes ?? 0) || 0,
								userId: data.user?.id
							})
						});
						if (res.ok) {
							completeOpen = false;
							const updated = await res.json().catch(() => null);
							if (updated) upsertTaskLocal(updated);
							setTimeout(() => {
								addNotificationBig({
									id: Date.now().toString(),
									createdAt: Date.now(),
									message: '💪'
								});
							}, 500);
						}
					}}
				>
					<div>
						<span class="text-neutral-500">Duration</span>
						<input
							class="w-full text-3xl"
							type="number"
							min="0"
							step="1"
							placeholder="Minutes"
							bind:value={completeMinutes}
						/>
					</div>

					<div class="flex flex-row justify-center gap-x-2">
						<Button grey type="submit" onclick={() => {}}>Save</Button>
						<Button onclick={() => (completeOpen = false)}>Cancel</Button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	{#if completedOptionsOpen && selectedTask}
		<div class="fixed inset-0 z-50 flex items-center justify-center px-10">
			<div class="absolute inset-0 bg-white/80"></div>
			<button
				aria-label="Close"
				class="absolute inset-0 z-0 bg-black/50"
				onclick={() => (completedOptionsOpen = false)}
			></button>
			<div
				class="relative z-10 flex w-full max-w-md flex-col gap-y-10 rounded-full bg-black/90 p-10 text-white"
				in:fly={{ duration: 500, easing: expoOut, y: 200 }}
				out:fade={{ duration: 100, easing: sineInOut }}
			>
				<h3 class="flex flex-row justify-center gap-x-2 text-3xl">
					<span>{selectedTask.emoji}</span><span>{selectedTask.title}</span>
				</h3>
				<div class="flex flex-col gap-y-0">
					<span>Duration</span>
					<div class="flex items-center justify-center gap-x-2">
						<input
							class="w-full text-3xl text-white"
							type="number"
							min="0"
							step="1"
							placeholder="Minutes"
							bind:value={completeMinutes}
						/>
						<Button
							big={false}
							grey
							onclick={async () => {
								if (!selectedTask) return;
								const res = await fetch(`/api/tasks/${selectedTask.id}`, {
									method: 'PATCH',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({ durationMinutes: Number(completeMinutes ?? 0) || 0 })
								});
								if (res.ok) {
									completedOptionsOpen = false;
									const updated = await res.json().catch(() => null);
									if (updated) upsertTaskLocal(updated);
									setTimeout(() => {
										addNotificationBig({
											id: Date.now().toString(),
											createdAt: Date.now(),
											message: '💪'
										});
									}, 500);
								}
							}}>Save</Button
						>
					</div>
				</div>
				<div class="flex flex-row justify-center gap-x-1">
					<Button
						onclick={async () => {
							if (!selectedTask) return;
							const res = await fetch('/api/tasks', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({
									title: selectedTask.title,
									emoji: selectedTask.emoji,
									assignedUserId: selectedTask.assignedUserId,
									scheduledAt: selectedTask.scheduledAt ?? null,
									recurrenceType: (selectedTask as any).recurrenceType ?? null,
									recurrenceInterval: (selectedTask as any).recurrenceInterval ?? null
								})
							});
							if (res.ok) {
								const created = await res.json().catch(() => null);
								if (created) upsertTaskLocal(created);
								completedOptionsOpen = false;
							}
						}}>Duplicate</Button
					>
					<Button
						red
						onclick={async () => {
							if (!selectedTask) return;
							if (!confirm('Delete this task?')) return;
							const res = await fetch(`/api/tasks/${selectedTask.id}`, { method: 'DELETE' });
							if (res.ok) {
								removeTaskLocal(selectedTask.id);
								completedOptionsOpen = false;
							}
						}}>Delete</Button
					>
				</div>
			</div>
		</div>
	{/if}

	{#if loggingIn}
		<div class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
			<div class="absolute inset-0 bg-white/80"></div>
			<div class="relative z-10 flex flex-col gap-y-5 rounded-full bg-black/90 p-10 text-white">
				<h3 class="text-3xl">Logging in...</h3>
			</div>
		</div>
	{/if}
</Portal>
