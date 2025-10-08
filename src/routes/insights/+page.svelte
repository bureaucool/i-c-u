<script lang="ts">
	import type { Task, Treat, User } from '$lib/types';
	import { rangeDays, percentages } from '$lib/stores/states';
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
	const MIN_EMOJI_REM = 0.875; // 14px
	const MAX_EMOJI_REM = 4; // 96px
	const REMS_PER_MINUTE = 0.125; // 2px per minute -> 0.125rem
	const itemSize = (m: number) => {
		const sizeRem = Math.max(MIN_EMOJI_REM, Math.min(MAX_EMOJI_REM, m * REMS_PER_MINUTE));
		return `${sizeRem}rem`;
	};

	// Range selector helpers
	const toDateTimeLocal = (ts: number) => {
		const d = new Date(Number(ts || Date.now()));
		const pad = (n: number) => String(n).padStart(2, '0');
		const yyyy = d.getFullYear();
		const mm = pad(d.getMonth() + 1);
		const dd = pad(d.getDate());
		const hh = pad(d.getHours());
		const mi = pad(d.getMinutes());
		return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
	};

	const youMinutesTotal = youTasks.reduce((acc, t) => acc + minutes(t), 0);
	const othersMinutesTotal = othersTasks.reduce((acc, t) => acc + minutes(t), 0);
	const totalMinutes = youMinutesTotal + othersMinutesTotal;
	const yourRawPercent = totalMinutes ? Math.round((youMinutesTotal / totalMinutes) * 100) : 0;
	const othersRawPercent = 100 - yourRawPercent;

	const youAvail = Number((userById.get(yourId) as any)?.availableTimeMinutesPerWeek ?? 0) || 0;
	const othersAvail = Array.from(userById.values())
		.filter((u) => u.id !== yourId)
		.reduce((acc, u: any) => acc + (Number(u?.availableTimeMinutesPerWeek ?? 0) || 0), 0);

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

<div class="relative z-20 flex flex-col gap-y-10 text-center">
	<p class="text-center text-3xl leading-tight">Don't compare, appreciate!<br />😚</p>

	<form
		class="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-3 text-left"
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

	<!-- <div class="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-6 text-left">
		<div class="rounded-lg bg-black/5 p-4">
			<div class="text-xs uppercase opacity-60">Raw</div>
			<div class="mt-1 text-3xl">
				{yourRawPercent}% <span class="text-base opacity-60">you</span>
			</div>
			<div class="opacity-60">{youMinutesTotal} min vs {othersMinutesTotal} min</div>
		</div>
		<div class="rounded-lg bg-black/5 p-4">
			<div class="text-xs uppercase opacity-60">Adjusted for availability</div>
			<div class="mt-1 text-3xl">
				{yourAdjPercent}% <span class="text-base opacity-60">you</span>
			</div>
			<div class="opacity-60">
				you {youMinutesTotal}/{youAvail}m, others {othersMinutesTotal}/{othersAvail}m
			</div>
		</div>
	</div> -->

	<div class="mt-4 grid grid-cols-2 gap-3">
		<div>
			<h3>You</h3>
			{#if youItems.length === 0}
				<p class="opacity-50">No items</p>
			{:else}
				<ul class="mt-2 flex flex-col gap-y-2 text-left">
					{#each youItems as item}
						<li class="flex items-center gap-x-3">
							<span
								class="relative select-none"
								style={`font-size:${itemSize(item.minutes)};line-height:1;`}
								>{item.emoji}
								{#if item.isNew}
									<span
										class="absolute -top-3 -left-3 rounded bg-amber-100/90 px-2 py-0.5 text-xs text-amber-500"
										>new</span
									>
								{/if}</span
							>
							<span class="flex flex-1 flex-col leading-tight">
								<span>{item.title}</span>
								<span class="opacity-60">({item.minutes} min)</span>
							</span>
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
							<span
								class="relative select-none"
								style={`font-size:${itemSize(item.minutes)};line-height:1;`}
								>{item.emoji}
								{#if item.isNew}
									<span
										class="absolute -top-3 -left-3 rounded bg-amber-100/90 px-2 py-0.5 text-xs text-amber-500"
										>new</span
									>
								{/if}
							</span>
							<span class="flex flex-col leading-tight">
								<span>{item.title}</span>
								<span class="opacity-60">({item.minutes} min)</span>
							</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</div>
