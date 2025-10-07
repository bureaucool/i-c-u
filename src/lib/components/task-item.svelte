<script lang="ts">
	import type { Task } from '$lib/types';

	let {
		task,
		clickComplete,
		clickEdit
	}: { task: Task; clickComplete: () => void; clickEdit: () => void } = $props();
</script>

<div class="flex flex-row items-center gap-x-1">
	<button
		aria-label="Complete task"
		class="mb-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-black"
		onclick={clickComplete}>&nbsp;</button
	>
	<button class="flex flex-col items-start gap-y-0" onclick={clickEdit}>
		<div class="text-2xl leading-none">
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
