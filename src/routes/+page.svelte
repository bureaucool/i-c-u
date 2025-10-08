<script lang="ts">
	import TaskItem from '$lib/components/task-item.svelte';
	import type { Task, User } from '$lib/types';
	import TaskDialog from '$lib/components/task-dialog.svelte';
	import TreatDialog from '$lib/components/treat-dialog.svelte';
	import { invalidateAll } from '$app/navigation';
	import Button from '$lib/components/button.svelte';
	import AcceptTreat from '$lib/components/accept-treat.svelte';
	import Floating from '$lib/components/floating.svelte';
	import { expoOut, sineInOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';

	import Portal from 'svelte-portal';

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
		};
	} = $props();

	let showAdd = $state(false);
	let formType: 'task' | 'treat' = $state('task');
	let loginMsg = $state<string | null>(null);
	let loginErr = $state<string | null>(null);
	let addMsg = $state<string | null>(null);
	let addErr = $state<string | null>(null);
	// Floating treat accept flow state
	let acceptingTreatId: number | null = $state(null);

	// One-time acceptance notification (for creator)
	let acceptedNotices = $state((data as any).acceptedTreatsToNotify ?? []);
	async function acknowledgeAccepted(id: number) {
		await fetch(`/api/treats/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ acknowledgeAccepted: true })
		});
		acceptedNotices = acceptedNotices.filter((t: any) => t.id !== id);
	}

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
		(data.activeTasks ?? data.tasks ?? []).filter((t) => {
			const ts = Number(t.scheduledAt ?? 0);
			return ts >= startOfDay && ts <= endOfDay;
		})
	);
	const tasksUpcoming = $derived(
		(data.activeTasks ?? data.tasks ?? []).filter((t) => {
			const ts = Number(t.scheduledAt ?? 0);
			return ts > endOfDay;
		})
	);
	const tasksNoDate = $derived(
		(data.activeTasks ?? data.tasks ?? []).filter((t) => t.scheduledAt == null)
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

	function openCompletedOptions(t: Task) {
		selectedTask = t;
		completeMinutes = Number((t as any).durationMinutes ?? '') || null;
		completedOptionsOpen = true;
	}
</script>

{#if !data.user}
	<div class="fixed top-3 right-3">
		<div class="flex flex-col gap-y-2">
			<form
				class="flex flex-col gap-y-2"
				onsubmit={async (e) => {
					e.preventDefault();
					loginMsg = loginErr = null;
					const form = new FormData(e.currentTarget as HTMLFormElement);
					const body = Object.fromEntries(form.entries());
					const res = await fetch('/api/auth', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(body)
					});
					if (res.ok) {
						loginMsg = 'Logged in. Reloading...';
						location.reload();
					} else {
						const err = await res.json().catch(() => ({}));
						loginErr = err?.error || err?.message || 'Login failed';
					}
				}}
			>
				<input name="email" type="email" placeholder="Email" required />
				<input name="password" type="password" placeholder="Password" required />
				<button type="submit">Log in</button>
			</form>
			{#if loginMsg}<p>{loginMsg}</p>{/if}
			{#if loginErr}<p>{loginErr}</p>{/if}
		</div>
		<div class="">Or <a href="/setup">setup</a> a new group</div>
	</div>
{/if}

{#if !data.user}
	<section class="flex h-screen w-screen flex-col items-center justify-center gap-y-5">
		<h2>i-c-u</h2>
		<p>Collaborative task manager, focused on appreciation and balance</p>
	</section>
{:else}
	<section class="relative flex flex-col gap-y-10">
		{#if (data.pendingTreats ?? []).length > 0}
			{#each data.pendingTreats ?? [] as tr}
				<Floating classes="z-50">
					<AcceptTreat onAccept={(id) => (acceptingTreatId = id)} {tr} {acceptingTreatId} />
				</Floating>
			{/each}
		{/if}

		{#if (acceptedNotices ?? []).length > 0}
			{#each acceptedNotices as tr}
				<Floating classes="z-50">
					<div class="flex items-center gap-x-3 rounded-lg bg-white p-3 shadow">
						<span class="text-2xl">{tr.emoji ?? '♥️'}</span>
						<div class="flex flex-col">
							<strong>Accepted</strong>
							<span class="opacity-80">{tr.title} ({tr.valueMinutes} min)</span>
						</div>
						<button class="ml-2" onclick={() => acknowledgeAccepted(tr.id)}>Dismiss</button>
					</div>
				</Floating>
			{/each}
		{/if}
		<section>
			<h2>Today</h2>
			{#if tasksToday.length === 0}
				<p class="text-3xl opacity-30">No tasks</p>
			{:else}
				<ul>
					{#each tasksToday as t}
						<li>
							<TaskItem
								users={data.users ?? []}
								currentUserId={data.user?.id ?? -1}
								task={t}
								clickComplete={() => openComplete(t)}
								clickEdit={() => openEdit(t)}
							/>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
		<section>
			<h2>Upcoming</h2>
			{#if tasksUpcoming.length === 0}
				<p class="text-3xl opacity-30">No tasks</p>
			{:else}
				<ul>
					{#each tasksUpcoming as t}
						<li>
							<TaskItem
								users={data.users ?? []}
								currentUserId={data.user?.id ?? -1}
								task={t}
								clickComplete={() => openComplete(t)}
								clickEdit={() => openEdit(t)}
							/>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section>
			<h2>Unscheduled</h2>
			{#if tasksNoDate.length === 0}
				<p class="text-3xl opacity-30">No tasks</p>
			{:else}
				<ul>
					{#each tasksNoDate as t}
						<li>
							<TaskItem
								users={data.users ?? []}
								currentUserId={data.user?.id ?? -1}
								task={t}
								clickComplete={() => openComplete(t)}
								clickEdit={() => openEdit(t)}
							/>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section>
			<h2>Completed</h2>
			{#if (data.completedTasks ?? []).length === 0}
				<p class="text-3xl opacity-30">No tasks</p>
			{:else}
				<ul>
					{#each data.completedTasks ?? [] as t}
						<li>
							<TaskItem
								completed
								users={data.users ?? []}
								currentUserId={data.user?.id ?? -1}
								task={t}
								clickComplete={() => {}}
								clickEdit={() => openCompletedOptions(t)}
							/>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
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
		<div class="fixed inset-0 z-50 flex items-center justify-center px-5 md:px-10">
			<div
				class="absolute inset-0 bg-white/80"
				transition:fade|global={{ duration: 100, easing: sineInOut }}
			></div>
			<button
				aria-label="Close"
				class="absolute inset-0 z-20 bg-black/50"
				onclick={() => (showAdd = false)}
			></button>
			<div
				class="relative z-30 flex w-full flex-col gap-y-10 rounded-xl bg-black/90 p-5 text-white"
				in:fly={{ duration: 500, easing: expoOut, y: 200 }}
				out:fade={{ duration: 100, easing: sineInOut }}
			>
				{#if !editOpen}
					<div class="flex flex-row justify-center gap-x-4 text-3xl">
						<button
							class="{formType !== 'task' ? 'opacity-50' : ''} cursor-pointer md:hover:scale-110"
							onclick={() => (formType = 'task')}>🔨 Task</button
						>
						<button
							class="{formType !== 'treat' ? 'opacity-50' : ''} cursor-pointer md:hover:scale-110"
							onclick={() => (formType = 'treat')}>♥️ Treat</button
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
							mode={'edit' as any}
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
										recurrenceInterval: (selectedTask as any).recurrenceInterval ?? null
									})
								});
								if (res.ok) {
									editOpen = false;
									showAdd = false;
									invalidateAll();
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
									invalidateAll();
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
							task={null}
							users={data.users ?? []}
							extras={(data.tasks ?? [])
								.map((t) => t.emoji)
								.filter((e) => typeof e === 'string') as string[]}
							onCancel={() => {
								showAdd = false;
							}}
							onSave={async (payload) => {
								addMsg = addErr = null;
								const res = await fetch('/api/tasks', {
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify(payload)
								});
								if (res.ok) {
									showAdd = false;

									invalidateAll();
								} else {
									addErr = 'Failed to create task';
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
							addMsg = addErr = null;
							const res = await fetch('/api/treats', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify(payload)
							});
							if (res.ok) {
								addMsg = 'Treat created';
								showAdd = false;

								invalidateAll();
							} else {
								const err = await res.json().catch(() => ({}));
								addErr = err?.error || err?.message || 'Failed to create treat';
							}
						}}
					/>
				{/if}

				{#if addMsg}<p>{addMsg}</p>{/if}
				{#if addErr}<p>{addErr}</p>{/if}
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
			<div
				class="relative z-10 flex flex-col gap-y-5 rounded-full bg-black/90 p-10 text-white"
				in:fly={{ duration: 500, easing: expoOut, y: 200 }}
				out:fade={{ duration: 100, easing: sineInOut }}
			>
				<h3 class="text-center text-3xl">
					<span class="inline-block pr-1">{selectedTask.emoji}</span>{selectedTask.title}
					<span class="inline-block pr-1 opacity-50">done</span>!
				</h3>

				<form
					class="flex flex-col gap-y-5"
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

							invalidateAll();
						}
					}}
				>
					<input
						class="w-full text-3xl"
						type="number"
						min="0"
						step="1"
						placeholder="Minutes"
						bind:value={completeMinutes}
					/>
					<div class="flex flex-row justify-center gap-x-2">
						<Button grey type="submit">Save</Button>
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
									invalidateAll();
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
								completedOptionsOpen = false;
								invalidateAll();
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
								completedOptionsOpen = false;
								invalidateAll();
							}
						}}>Delete</Button
					>
				</div>
			</div>
		</div>
	{/if}
</Portal>
