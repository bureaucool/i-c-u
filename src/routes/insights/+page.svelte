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
	const itemSize = (m: number) => {
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

	// Categorize treats by creator
	const yourCreatedTreats = (data.treatsAll ?? []).filter(
		(t) => t.accepted && t.fromUserId === yourId
	);
	const othersCreatedTreats = (data.treatsAll ?? []).filter(
		(t) => t.accepted && t.fromUserId !== yourId
	);

	type InsightItem = {
		kind: 'task' | 'treat';
		title: string;
		emoji: string;
		minutes: number;
		isNew: boolean;
	};

	const youItems: InsightItem[] = [
		...youTasks.map((t) => ({
			kind: 'task' as const,
			title: t.title,
			emoji: (t.emoji as string) || '📎',
			minutes: minutes(t),
			isNew: isRecent(t)
		})),
		...yourCreatedTreats.map((tr) => ({
			kind: 'treat' as const,
			title: tr.title,
			emoji: tr.emoji || '♥️',
			minutes: tr.valueMinutes,
			isNew: Number((tr as any).acceptedAt ?? 0) >= Number(data.recentSince ?? 0)
		}))
	];

	const othersItems: InsightItem[] = [
		...othersTasks.map((t) => ({
			kind: 'task' as const,
			title: t.title,
			emoji: (t.emoji as string) || '📎',
			minutes: minutes(t),
			isNew: isRecent(t)
		})),
		...othersCreatedTreats.map((tr) => ({
			kind: 'treat' as const,
			title: tr.title,
			emoji: tr.emoji || '♥️',
			minutes: tr.valueMinutes,
			isNew: Number((tr as any).acceptedAt ?? 0) >= Number(data.recentSince ?? 0)
		}))
	];
</script>

<div class="relative z-20 px-10 py-32 text-center">
	<p class="text-center text-3xl">Don't compare, appreciate!<br />😚</p>

	<div class="mt-4 grid grid-cols-2 gap-3">
		<div>
			<h3>You</h3>
			{#if youItems.length === 0}
				<p class="opacity-50">No items</p>
			{:else}
				<ul class="mt-2 flex flex-col gap-y-2 text-left">
					{#each youItems as item}
						<li class="flex items-center gap-x-3">
							<span class="select-none" style={`font-size:${itemSize(item.minutes)};line-height:1;`}
								>{item.emoji}</span
							>
							<span class="flex-1">
								{item.title}
								<span class="opacity-60">({item.minutes} min)</span>
							</span>
							{#if item.isNew}
								<span class="rounded bg-amber-100/50 px-2 py-0.5 text-xs text-amber-500">new</span>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
		<div>
			<h3>Others</h3>
			{#if othersItems.length === 0}
				<p class="opacity-50">No items</p>
			{:else}
				<ul class="mt-2 flex flex-col gap-y-2 text-left">
					{#each othersItems as item}
						<li class="flex items-center gap-x-3">
							<span class="select-none" style={`font-size:${itemSize(item.minutes)};line-height:1;`}
								>{item.emoji}</span
							>
							<span class="flex-1">
								{item.title}
								<span class="opacity-60">({item.minutes} min)</span>
							</span>
							{#if item.isNew}
								<span class="rounded bg-amber-100/50 px-2 py-0.5 text-xs text-amber-500">new</span>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</div>
