<script lang="ts">
	import type { Task, User } from '$lib/types';

	let {
		data
	}: {
		data: { user?: { id: number; name: string } | null; tasks?: Task[]; users?: User[] };
	} = $props();
	let showAdd = $state(false);
	let formType: 'task' | 'treat' = $state('task');
	let loginMsg = $state<string | null>(null);
	let loginErr = $state<string | null>(null);
	let addMsg = $state<string | null>(null);
	let addErr = $state<string | null>(null);

	const now = new Date();
	const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

	const tasksToday = (data.tasks ?? []).filter((t) => {
		const ts = Number(t.scheduledAt ?? 0);
		return ts >= startOfDay && ts <= endOfDay;
	});
	const tasksUpcoming = (data.tasks ?? []).filter((t) => {
		const ts = Number(t.scheduledAt ?? 0);
		return ts > endOfDay;
	});
	const tasksNoDate = (data.tasks ?? []).filter((t) => t.scheduledAt == null);
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
	<section>
		<h2>Today</h2>
		{#if tasksToday.length === 0}
			<p>No tasks today</p>
		{:else}
			<ul>
				{#each tasksToday as t}
					<li>{t.emoji} {t.title}</li>
				{/each}
			</ul>
		{/if}
		<section>
			<h2>Upcoming</h2>
			{#if tasksUpcoming.length === 0}
				<p>No upcoming tasks</p>
			{:else}
				<ul>
					{#each tasksUpcoming as t}
						<li>{t.emoji} {t.title}</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section>
			<h2>Unscheduled</h2>
			{#if tasksNoDate.length === 0}
				<p>All tasks scheduled</p>
			{:else}
				<ul>
					{#each tasksNoDate as t}
						<li>{t.emoji} {t.title}</li>
					{/each}
				</ul>
			{/if}
		</section>
	</section>

	<div class="fixed inset-x-3 bottom-3">
		<button
			onclick={() => {
				showAdd = true;
			}}>Add</button
		>
	</div>
{/if}

{#if showAdd}
	<div>
		<div>
			<button onclick={() => (formType = 'task')}>Task</button>
			<button onclick={() => (formType = 'treat')}>Treat</button>
		</div>

		{#if formType === 'task'}
			<form
				onsubmit={async (e) => {
					e.preventDefault();
					addMsg = addErr = null;
					const form = new FormData(e.currentTarget as HTMLFormElement);
					const body = Object.fromEntries(form.entries());
					// compute scheduledAt from optional date/time
					const date = (body.date as string | undefined) ?? '';
					const time = (body.time as string | undefined) ?? '';
					let scheduledAt: number | null = null;
					if (date) {
						const iso = time ? `${date}T${time}:00` : `${date}T00:00:00`;
						scheduledAt = new Date(iso).getTime();
					}
					const payload = {
						title: body.title,
						assignedUserId: body.assignedUserId || null,
						scheduledAt,
						recurrenceType: body.recurrenceType || null,
						recurrenceInterval: body.recurrenceInterval ? Number(body.recurrenceInterval) : null
					};
					const res = await fetch('/api/tasks', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(payload)
					});
					if (res.ok) {
						addMsg = 'Task created';
						showAdd = false;
						location.reload();
					} else {
						const err = await res.json().catch(() => ({}));
						addErr = err?.error || err?.message || 'Failed to create task';
					}
				}}
			>
				<input name="title" placeholder="Title" required />
				<!-- optional date/time -->
				<input name="date" type="date" />
				<input name="time" type="time" />
				<!-- recurrence -->
				<select name="recurrenceType">
					<option value="">One-time</option>
					<option value="daily">Daily</option>
					<option value="weekly">Weekly</option>
					<option value="monthly">Monthly</option>
					<option value="every_x_days">Every X days</option>
					<option value="every_x_weeks">Every X weeks</option>
					<option value="every_x_months">Every X months</option>
				</select>
				<input name="recurrenceInterval" type="number" min="1" placeholder="X" />
				<select name="assignedUserId">
					<option value="">Unassigned</option>
					{#each data.users ?? ([] as User[]) as u}
						<option value={u.id}>{u.name}</option>
					{/each}
				</select>
				<button type="submit">Create Task</button>
			</form>
		{:else}
			<form
				onsubmit={async (e) => {
					e.preventDefault();
					addMsg = addErr = null;
					const form = new FormData(e.currentTarget as HTMLFormElement);
					const body = Object.fromEntries(form.entries());
					const res = await fetch('/api/treats', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(body)
					});
					if (res.ok) {
						addMsg = 'Treat created';
						showAdd = false;
						location.reload();
					} else {
						const err = await res.json().catch(() => ({}));
						addErr = err?.error || err?.message || 'Failed to create treat';
					}
				}}
			>
				<input name="title" placeholder="Title" required />
				<!-- fromUser is current user -->
				<select name="toUserId" required>
					{#each data.users ?? ([] as User[]) as u}
						<option value={u.id}>{u.name}</option>
					{/each}
				</select>
				<input name="valueMinutes" type="number" placeholder="Value (minutes)" required />
				<button type="submit">Create Treat</button>
			</form>
		{/if}

		{#if addMsg}<p>{addMsg}</p>{/if}
		{#if addErr}<p>{addErr}</p>{/if}

		<button
			onclick={() => {
				showAdd = false;
			}}>Close</button
		>
	</div>
{/if}
