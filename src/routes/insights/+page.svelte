<script lang="ts">
	import type { Task, Treat, User } from '$lib/types';
	import { rangeDays, percentages } from '$lib/stores/states';
	import MiniTag from '$lib/components/mini-tag.svelte';
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
			rangeFrom: number;
			rangeTo: number;
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
	const MIN_EMOJI_REM = 2; // 14px
	const MAX_EMOJI_REM = 4; // 96px
	const REMS_PER_MINUTE = 0.125; // 2px per minute -> 0.125rem
	const itemSize = (m: number) => {
		const sizeRem = Math.max(MIN_EMOJI_REM, Math.min(MAX_EMOJI_REM, m * REMS_PER_MINUTE));
		return `${sizeRem}rem`;
	};

	const youMinutesTotal = youTasks.reduce((acc, t) => acc + minutes(t), 0);
	const othersMinutesTotal = othersTasks.reduce((acc, t) => acc + minutes(t), 0);
	const totalMinutes = youMinutesTotal + othersMinutesTotal;
	const yourRawPercent = totalMinutes ? Math.round((youMinutesTotal / totalMinutes) * 100) : 0;
	const othersRawPercent = 100 - yourRawPercent;

	// Calculate available time as: total minutes in week (10,080) - working hours
	const MINUTES_PER_WEEK = 10080;
	const yourWorkingHours =
		Number((userById.get(yourId) as any)?.availableTimeMinutesPerWeek ?? 0) || 0;
	const youAvail = Math.max(0, MINUTES_PER_WEEK - yourWorkingHours);

	// Calculate available time for each other user, then sum
	const othersAvail = Array.from(userById.values())
		.filter((u) => u.id !== yourId)
		.reduce((acc, u: any) => {
			const workingHours = Number(u?.availableTimeMinutesPerWeek ?? 0) || 0;
			return acc + Math.max(0, MINUTES_PER_WEEK - workingHours);
		}, 0);

	const youNorm = youAvail > 0 ? youMinutesTotal / youAvail : 0;
	const othersNorm = othersAvail > 0 ? othersMinutesTotal / othersAvail : 0;
	const normSum = youNorm + othersNorm;
	const yourAdjPercent = normSum ? Math.round((youNorm / normSum) * 100) : 0;
	const othersAdjPercent = 100 - yourAdjPercent;

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
		id: number;
		kind: 'task' | 'treat';
		title: string;
		emoji: string;
		minutes: number;
		isNew: boolean;
	};

	const youItems: InsightItem[] = [
		...youTasks.map((t) => ({
			id: t.id,
			kind: 'task' as const,
			title: t.title,
			emoji: (t.emoji as string) || '📎',
			minutes: minutes(t),
			isNew: isRecent(t)
		})),
		...yourCreatedTreats.map((tr) => ({
			id: tr.id,
			kind: 'treat' as const,
			title: tr.title,
			emoji: tr.emoji || '♥️',
			minutes: tr.valueMinutes,
			isNew: Number((tr as any).acceptedAt ?? 0) >= Number(data.recentSince ?? 0)
		}))
	];

	const othersItems: InsightItem[] = [
		...othersTasks.map((t) => ({
			id: t.id,
			kind: 'task' as const,
			title: t.title,
			emoji: (t.emoji as string) || '📎',
			minutes: minutes(t),
			isNew: isRecent(t)
		})),
		...othersCreatedTreats.map((tr) => ({
			id: tr.id,
			kind: 'treat' as const,
			title: tr.title,
			emoji: tr.emoji || '♥️',
			minutes: tr.valueMinutes,
			isNew: Number((tr as any).acceptedAt ?? 0) >= Number(data.recentSince ?? 0)
		}))
	];

	// Calculate per-user stats for detailed comparison
	const otherUsers = Array.from(userById.values()).filter((u) => u.id !== yourId);
	const userStats = otherUsers.map((user) => {
		const userTasks = (data.tasksDone ?? []).filter((t) => t.assignedUserId === user.id);
		const userCreatedTreats = (data.treatsAll ?? []).filter(
			(t) => t.accepted && t.fromUserId === user.id
		);
		const userMinutes = [
			...userTasks.map((t) => minutes(t)),
			...userCreatedTreats.map((tr) => tr.valueMinutes)
		].reduce((acc, m) => acc + m, 0);
		const workingHours = Number((user as any)?.availableTimeMinutesPerWeek ?? 0) || 0;
		const availTime = Math.max(0, MINUTES_PER_WEEK - workingHours);
		const percentUsed = availTime > 0 ? (userMinutes / availTime) * 100 : 0;
		return {
			user,
			minutes: userMinutes,
			availTime,
			percentUsed
		};
	});
</script>

<div class="relative z-20 mt-5 flex flex-col gap-y-5 text-center">
	<p class="text-center text-2xl leading-tight">Don't compare, appreciate!<br />😚</p>

	<form
		class="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3 text-left"
		method="GET"
	>
		<label for="range-select" class="text-sm opacity-60">Comparison range</label>
		<select
			id="range-select"
			name="range"
			class="rounded border border-black/20 bg-white/80 px-2 py-1"
			onchange={(e) => {
				const v = Number((e.currentTarget as HTMLSelectElement).value);
				rangeDays.set(v === 30 ? 30 : 7);
				fetch(`/api/insights?range=${$rangeDays}`)
					.then((r) => r.json())
					.then((j) => {
						percentages.set(j.percentages ?? [0, 0]);
					});
			}}
		>
			<option value="7" selected>Last 7 days</option>
			<option value="30">Last 30 days</option>
		</select>
	</form>

	<!-- Time usage comparison -->
	<div class="mx-auto max-w-2xl rounded-lg bg-white/80 p-4 shadow-sm">
		<h3 class="mb-3 text-lg font-medium">Time Usage Relative to Available Time</h3>
		<div class="grid grid-cols-2 gap-4 text-left">
			<div>
				<p class="text-sm text-neutral-500">You</p>
				<p class="text-2xl font-semibold">
					{youAvail > 0 ? ((youMinutesTotal / youAvail) * 100).toFixed(1) : 0}%
				</p>
				<p class="text-xs text-neutral-400">
					{youMinutesTotal} min of {youAvail} available
				</p>
			</div>
			<div>
				<p class="text-sm text-neutral-500">Others (Combined)</p>
				<p class="text-2xl font-semibold">
					{othersAvail > 0 ? ((othersMinutesTotal / othersAvail) * 100).toFixed(1) : 0}%
				</p>
				<p class="text-xs text-neutral-400">
					{othersMinutesTotal} min of {othersAvail} available
				</p>
			</div>
		</div>
		<div class="mt-3 border-t border-neutral-200 pt-3">
			<p class="text-xs text-neutral-500">
				Normalized comparison (adjusted for availability): {yourAdjPercent}% you, {othersAdjPercent}%
				others
			</p>
		</div>
	</div>

	<!-- Per-user breakdown -->
	{#if userStats.length > 0}
		<div class="mx-auto max-w-2xl rounded-lg bg-white/80 p-4 shadow-sm">
			<h3 class="mb-3 text-lg font-medium">Per-User Breakdown</h3>
			<div class="flex flex-col gap-y-3">
				{#each userStats as stat (stat.user.id)}
					<div class="flex items-center justify-between text-left">
						<div class="flex-1">
							<p class="font-medium">{stat.user.name}</p>
							<p class="text-xs text-neutral-400">
								{stat.minutes} min of {stat.availTime} available
							</p>
						</div>
						<div class="text-right">
							<p class="text-xl font-semibold">{stat.percentUsed.toFixed(1)}%</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<div class="mt-4 grid grid-cols-2 gap-3">
		<div>
			<h3 class="mb-5 text-xl text-neutral-500">You</h3>
			{#if youItems.length === 0}
				<p class="opacity-50">No items</p>
			{:else}
				<ul class="mt-2 flex flex-col gap-y-3 text-left">
					{#each youItems as item (item.id)}
						<li class="flex items-center gap-x-3">
							<span
								class="relative select-none"
								style={`font-size:${itemSize(item.minutes)};line-height:1;`}
								>{item.emoji}
								{#if item.isNew}
									<div class="absolute -top-3 -left-3 -translate-x-1/2">
										<MiniTag>new</MiniTag>
									</div>
								{/if}</span
							>
							<span class="flex flex-1 flex-col gap-y-0.25 leading-tight">
								<span class="text-lg leading-none">{item.title}</span>
								<span class="text-xs text-neutral-400">({item.minutes} min)</span>
							</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
		<div>
			<h3 class="mb-5 text-xl text-neutral-500">Others</h3>
			{#if othersItems.length === 0}
				<p class="opacity-50">No items</p>
			{:else}
				<ul class="mt-2 flex flex-col gap-y-3 text-left">
					{#each othersItems as item (item.id)}
						<li class="flex items-center gap-x-3">
							<span
								class="relative select-none"
								style={`font-size:${itemSize(item.minutes)};line-height:1;`}
								>{item.emoji}
								{#if item.isNew}
									<div class="absolute -top-3 -left-3 -translate-x-1/2">
										<MiniTag>new</MiniTag>
									</div>
								{/if}
							</span>
							<div>
								<span class="flex flex-col gap-y-0.25 leading-none">
									<span class="text-lg leading-none">{item.title}</span>
									<span class="text-xs text-neutral-400">({item.minutes} min)</span>
								</span>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</div>
