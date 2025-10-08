<script lang="ts">
	import type { Task } from '$lib/types';

	let {
		task,
		completed = false,
		clickComplete,
		clickEdit
	}: {
		task: Task;
		completed?: boolean;
		clickComplete: () => void;
		clickEdit: () => void;
	} = $props();
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
				{#if task.assignedUserId}
					<span>{task.assignedUserId}</span>
				{/if}
			</div>
		</div>
	</button>
</div>
