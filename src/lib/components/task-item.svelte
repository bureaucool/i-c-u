<script lang="ts">
	import type { Task } from '$lib/types';

	let {
		task,
		clickComplete,
		clickEdit
	}: { task: Task; clickComplete: () => void; clickEdit: () => void } = $props();
</script>

<div class="flex flex-row gap-x-2">
	<button
		aria-label="Complete task"
		class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-black"
		onclick={clickComplete}>&nbsp;</button
	>
	<button class="flex flex-col gap-y-2" onclick={clickEdit}>
		<div>
			<span>{task.emoji}</span>
			<span>{task.title}</span>
		</div>
		<div>
			{#if task.scheduledAt}
				<span>{new Date(task.scheduledAt).toLocaleDateString()}</span>
			{/if}
			{#if task.assignedUserId}
				<span>{task.assignedUserId}</span>
			{/if}
		</div>
	</button>
</div>
