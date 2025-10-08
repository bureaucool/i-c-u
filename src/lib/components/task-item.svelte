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
					<span>{new Date(task.scheduledAt).toLocaleDateString()}</span>
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
