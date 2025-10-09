<script lang="ts">
	import type { Task, User } from '$lib/types';

	let {
		task,
		completed = false,
		clickComplete,
		clickEdit,
		users = [] as User[],
		currentUserId = -1
	}: {
		task: Task;
		completed?: boolean;
		clickComplete: () => void;
		clickEdit: () => void;
		users?: User[];
		currentUserId?: number;
	} = $props();

	const userById = new Map(users.map((u) => [u.id, u] as const));

	function formatScheduledDate(timestamp: number): string {
		const date = new Date(timestamp);
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = String(date.getFullYear());
		const hours = date.getHours();
		const minutes = date.getMinutes();
		const base = `${day}.${month}.${year}`;
		if (hours !== 0 || minutes !== 0) {
			const hh = String(hours).padStart(2, '0');
			const mm = String(minutes).padStart(2, '0');
			return `${base} ${hh}:${mm}`;
		}
		return base;
	}
</script>

<div class="flex flex-row items-center gap-x-1">
	<button
		aria-label="Complete task"
		class="mb-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-2 md:hover:scale-110 {completed
			? 'bg-black'
			: ''}"
		onclick={clickComplete}>&nbsp;</button
	>
	<button
		class="gap-y- flex cursor-pointer flex-col items-start md:hover:opacity-50"
		onclick={clickEdit}
	>
		<div class="text-3xl leading-none">
			<span>{task.emoji}</span>
			<span>{task.title}</span>
		</div>
		<div class="">
			<div class="pl-1">
				{#if task.scheduledAt}
					<span>{formatScheduledDate(task.scheduledAt)}</span>
				{/if}
				{#if task.assignedUserId != null}
					<span class="rounded-full bg-neutral-200 px-3 py-0.25 leading-none"
						>{task.assignedUserId === currentUserId
							? 'You'
							: (userById.get(task.assignedUserId)?.name ?? 'unknown')}</span
					>
				{/if}
			</div>
		</div>
	</button>
</div>
