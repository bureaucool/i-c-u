<script lang="ts">
	import type { Task, Treat, User } from '$lib/types';
	let {
		data
	}: {
		data: {
			user: { id: number; name: string } | null;
			tasksDone: Task[];
			recentTasks: Task[];
			recentSince: number;
			treatsAll: Treat[];
			users: User[];
		};
	} = $props();

	const userById = new Map(data.users.map((u) => [u.id, u] as const));
	const yourId = data.user?.id ?? -1;

	const youTasks = (data.tasksDone ?? []).filter((t) => t.assignedUserId === yourId);
	const othersTasks = (data.tasksDone ?? []).filter(
		(t) => t.assignedUserId == null || t.assignedUserId !== yourId
	);

	const isRecent = (t: Task) =>
		Number((t as any).completedAt ?? 0) >= Number(data.recentSince ?? 0);
	const minutes = (t: Task) => Number((t as any).durationMinutes ?? 0) || 0;
	const circleSize = (m: number) => {
		const clamped = Math.max(12, Math.min(96, m * 2));
		return `${clamped}px`;
	};

	const heartSize = (m: number) => {
		const clamped = Math.max(14, Math.min(96, m * 2));
		return `${clamped}px`;
	};

	// Aggregates kept for reference (net balance)
	const treatsValueByUser = new Map<number, number>();
	for (const tr of data.treatsAll ?? []) {
		if (!tr.accepted) continue;
		treatsValueByUser.set(tr.toUserId, (treatsValueByUser.get(tr.toUserId) ?? 0) + tr.valueMinutes);
		treatsValueByUser.set(
			tr.fromUserId,
			(treatsValueByUser.get(tr.fromUserId) ?? 0) - tr.valueMinutes
		);
	}
</script>

<div class="relative z-20 px-10 py-32 text-center">
	<h2>Insights</h2>

	<section>
		<h3>Completed tasks</h3>
		<div class="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
			<div>
				<h4>You</h4>
				{#if youTasks.length === 0}
					<p class="opacity-50">No completed tasks</p>
				{:else}
					<ul class="mt-2 flex flex-col gap-y-2 text-left">
						{#each youTasks as t}
							<li class="flex items-center gap-x-3">
								<span
									class="inline-block rounded-full bg-blue-300"
									style={`width:${circleSize(minutes(t))};height:${circleSize(minutes(t))};`}
								></span>
								<span class="flex-1">
									{t.title}
									<span class="opacity-60">({minutes(t)} min)</span>
								</span>
								{#if isRecent(t)}<span class="text-amber-500">new</span>{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</div>
			<div>
				<h4>All others</h4>
				{#if othersTasks.length === 0}
					<p class="opacity-50">No completed tasks</p>
				{:else}
					<ul class="mt-2 flex flex-col gap-y-2 text-left">
						{#each othersTasks as t}
							<li class="flex items-center gap-x-3">
								<span
									class="inline-block rounded-full bg-green-300"
									style={`width:${circleSize(minutes(t))};height:${circleSize(minutes(t))};`}
								></span>
								<span class="flex-1">
									{t.title}
									<span class="opacity-60">({minutes(t)} min)</span>
									<span class="ml-1 opacity-60"
										>— {t.assignedUserId == null
											? 'unassigned'
											: userById.get(t.assignedUserId)?.name}</span
									>
								</span>
								{#if isRecent(t)}<span class="text-amber-500">new</span>{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	</section>

	<section>
		<h3>Treats</h3>
		<div class="mt-2 flex flex-wrap items-center justify-center gap-4">
			{#each (data.treatsAll ?? []).filter((t) => t.accepted) as tr}
				<div class="flex items-center gap-x-2">
					<span class="select-none" style={`font-size:${heartSize(tr.valueMinutes)};line-height:1;`}
						>{tr.emoji ?? '♥️'}</span
					>
					<span class="text-left opacity-70">{tr.title} ({tr.valueMinutes} min)</span>
				</div>
			{/each}
		</div>
	</section>
</div>
