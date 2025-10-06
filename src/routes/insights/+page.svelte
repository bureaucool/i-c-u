<script lang="ts">
	type TaskLite = { id: number; assignedUserId: number | null; durationMinutes: number | null };
	type TreatLite = {
		id: number;
		fromUserId: number;
		toUserId: number;
		accepted: boolean;
		valueMinutes: number;
	};
	type UserLite = { id: number; name: string };
	let { data }: { data: { tasksDone: TaskLite[]; treatsAll: TreatLite[]; users: UserLite[] } } =
		$props();

	const userById = new Map(data.users.map((u) => [u.id, u] as const));
	const minutesByUser = new Map<number, number>();
	for (const t of data.tasksDone) {
		if (t.assignedUserId == null || t.durationMinutes == null) continue;
		minutesByUser.set(
			t.assignedUserId,
			(minutesByUser.get(t.assignedUserId) ?? 0) + t.durationMinutes
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
