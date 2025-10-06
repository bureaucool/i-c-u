<script lang="ts">
	type TaskLite = {
		id: number;
		title: string;
		emoji: string | null;
		scheduledAt: number | null;
		assignedUserId: number | null;
	};
	type UserLite = { id: number; name: string };

	let {
		data
	}: {
		data: { user?: { id: number; name: string } | null; tasks?: TaskLite[]; users?: UserLite[] };
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
	<section class="flex flex-col gap-y-10">
		<div>
			<h2>Welcome to i-c-u</h2>
			<p>Collaborative task manager for balancing time and treats.</p>
		</div>
		<form
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
		<p>Or go to <a href="/setup">/setup</a> to create your first group.</p>
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
		{/if}

		<button
			onclick={() => {
				showAdd = true;
			}}>Add</button
		>
	</section>
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
					const res = await fetch('/api/tasks', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(body)
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
				<input name="groupId" type="number" placeholder="Group ID" required />
				<select name="assignedUserId">
					<option value="">Unassigned</option>
					{#each data.users as u}
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
				<input name="groupId" type="number" placeholder="Group ID" required />
				<select name="fromUserId" required>
					{#each data.users as u}
						<option value={u.id}>{u.name}</option>
					{/each}
				</select>
				<select name="toUserId" required>
					{#each data.users as u}
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
