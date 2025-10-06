<script lang="ts">
	import type { Task } from '$lib/types';

	let { task }: { task: Task } = $props();
</script>

<div>
	<span>{task.emoji}</span>
	<span>{task.title}</span>
	{#if task.scheduledAt}
		<span>{new Date(task.scheduledAt).toLocaleDateString()}</span>
	{/if}
	{#if task.assignedUserId}
		<span>{task.assignedUserId}</span>
	{/if}
</div>
