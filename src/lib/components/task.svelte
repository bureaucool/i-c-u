<script lang="ts">
	type TaskLite = {
		id: number;
		title: string;
		emoji: string | null;
		scheduledAt: number | null;
		assignedUserId: number | null;
	};
	let { task }: { task: TaskLite } = $props();
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
