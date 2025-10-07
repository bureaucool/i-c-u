<script lang="ts">
	import TaskItem from '$lib/components/task-item.svelte';
	import type { Task, User } from '$lib/types';
	import TaskDialog from '$lib/components/task-dialog.svelte';
	import TreatDialog from '$lib/components/treat-dialog.svelte';
	import { invalidateAll } from '$app/navigation';
	import Button from '$lib/components/button.svelte';

	let {
		data
	}: {
		data: {
			user?: { id: number; name: string } | null;
			tasks?: Task[];
			activeTasks?: Task[];
			completedTasks?: Task[];
			users?: User[];
		};
	} = $props();
	let showAdd = $state(false);
	let formType: 'task' | 'treat' = $state('task');
	let loginMsg = $state<string | null>(null);
	let loginErr = $state<string | null>(null);
	let addMsg = $state<string | null>(null);
	let addErr = $state<string | null>(null);

	let title = $state<string | null>(null);
	let emoji = $state<string | null>('');
	let selectableEmojis = $state<string[]>([]);
	let showPicker = $state(false);

	// Overlays for complete/edit
	let completeOpen = $state(false);
	let editOpen = $state(false);
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

	const tasksToday = (data.activeTasks ?? data.tasks ?? []).filter((t) => {
		const ts = Number(t.scheduledAt ?? 0);
		return ts >= startOfDay && ts <= endOfDay;
	});
	const tasksUpcoming = (data.activeTasks ?? data.tasks ?? []).filter((t) => {
		const ts = Number(t.scheduledAt ?? 0);
		return ts > endOfDay;
	});
	const tasksNoDate = (data.activeTasks ?? data.tasks ?? []).filter((t) => t.scheduledAt == null);

	async function checkFormEmoji() {
		const title = (document.querySelector('input[name="title"]') as HTMLInputElement)?.value;
		if (!title) {
			selectableEmojis = [];
			return;
		}
		try {
			const foundEmojis = await fetch(`/api/emoji?title=${encodeURIComponent(title)}`).then((res) =>
				res.json()
			);
			selectableEmojis = Array.isArray(foundEmojis)
				? foundEmojis
						.map((e: any) => (typeof e === 'string' ? e : e.emoji || e.character))
						.filter((ch: any) => typeof ch === 'string' && ch.length > 0)
				: [];
		} catch {
			selectableEmojis = [];
		}
	}

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
	<section class="mx-auto flex max-w-xl flex-col gap-y-10 px-10 py-20">
		<section>
			<h2>Today</h2>
			{#if tasksToday.length === 0}
				<p class="text-2xl opacity-30">No tasks</p>
			{:else}
				<ul>
					{#each tasksToday as t}
						<li>
							<TaskItem
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
				<p class="text-2xl opacity-30">No tasks</p>
			{:else}
				<ul>
					{#each tasksUpcoming as t}
						<li>
							<TaskItem
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
				<p class="text-2xl opacity-30">No tasks</p>
			{:else}
				<ul>
					{#each tasksNoDate as t}
						<li>
							<TaskItem
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
				<p class="text-2xl opacity-30">No tasks</p>
			{:else}
				<ul>
					{#each data.completedTasks ?? [] as t}
						<li>
							<TaskItem task={t} clickComplete={() => {}} clickEdit={() => openEdit(t)} />
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
			}}>Add</Button
		>
	</div>
{/if}

{#if showAdd}
	<div class="fixed inset-0 z-20 flex items-center justify-center bg-white/80 px-10">
		<button
			aria-label="Close"
			class="absolute inset-0 z-0 bg-black/50"
			onclick={() => (showAdd = false)}
		></button>
		<div class="relative z-10 flex flex-col gap-y-10 rounded-md bg-black/50 p-5 text-white">
			{#if !editOpen}
				<div class="flex flex-row justify-center gap-x-5">
					<button
						class={formType !== 'task' ? 'opacity-50' : ''}
						onclick={() => (formType = 'task')}>Task</button
					>
					<button
						class={formType !== 'treat' ? 'opacity-50' : ''}
						onclick={() => (formType = 'treat')}>Treat</button
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
								// location.reload();
								invalidateAll();
							}
						}}
						onDelete={async () => {
							if (!selectedTask) return;
							const res = await fetch(`/api/tasks/${selectedTask.id}`, { method: 'DELETE' });
							if (res.ok) {
								editOpen = false;
								// location.reload();
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
								// location.reload();
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
	<div>
		<h3>Complete task</h3>
		<p>{selectedTask.title}</p>
		<form
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
			<input type="number" min="0" step="1" placeholder="Minutes" bind:value={completeMinutes} />
			<button type="submit">Save</button>
			<button type="button" onclick={() => (completeOpen = false)}>Cancel</button>
		</form>
	</div>
{/if}
