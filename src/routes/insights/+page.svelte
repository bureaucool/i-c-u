<script lang="ts">
	import type { Task, Treat, User } from '$lib/types';
	let { data }: { data: { tasksDone: Task[]; treatsAll: Treat[]; users: User[] } } = $props();

	const userById = new Map(data.users.map((u) => [u.id, u] as const));
	const minutesByUser = new Map<number, number>();
	for (const t of data.tasksDone) {
		if (t.assignedUserId == null || (t as any).durationMinutes == null) continue;
		minutesByUser.set(
			t.assignedUserId,
			(minutesByUser.get(t.assignedUserId) ?? 0) + Number((t as any).durationMinutes)
		);
	}
	const treatsValueByUser = new Map<number, number>();
	for (const tr of data.treatsAll) {
		if (!tr.accepted) continue;
		treatsValueByUser.set(tr.toUserId, (treatsValueByUser.get(tr.toUserId) ?? 0) + tr.valueMinutes);
		// negative value for the giver
		treatsValueByUser.set(
			tr.fromUserId,
			(treatsValueByUser.get(tr.fromUserId) ?? 0) - tr.valueMinutes
		);
	}
</script>

<div class="relative z-20 px-10 py-20 text-center">
	<h2>Insights</h2>

	<section>
		<h3>Time spent per user (done tasks)</h3>
		<ul>
			{#each Array.from(minutesByUser.entries()) as [uid, minutes]}
				<li>{userById.get(uid)?.name}: {minutes} min</li>
			{/each}
		</ul>
	</section>

	<section>
		<h3>Treat balance (net minutes)</h3>
		<ul>
			{#each Array.from(treatsValueByUser.entries()) as [uid, minutes]}
				<li>{userById.get(uid)?.name}: {minutes} min</li>
			{/each}
		</ul>
	</section>
</div>
