<script lang="ts">
	import type { Task } from '$lib/types';
	import TaskItem from './task-item.svelte';

	let {
		tasks,
		title,
		userId,
		hideUser = false,
		limit = 0,
		openComplete,
		openEdit,
		onDelete
	}: {
		tasks: Task[];
		title: string;
		userId: number;
		hideUser?: boolean;
		limit?: number; // 0 means no limit
		openComplete: (task: Task) => void;
		openEdit: (task: Task) => void;
		onDelete: (task: Task) => void;
	} = $props();

	let showAll = $state(false);
	const visibleTasks: Task[] = $derived(
		!Array.isArray(tasks) ? ([] as Task[]) : limit && !showAll ? tasks.slice(0, limit) : tasks
	);
</script>

<section>
	<div class="mb-2 flex w-full justify-between">
		<h2 class="text-neutral-500">{title}</h2>
		{#if limit && tasks.length > limit}
			<button class="text-neutral-500" type="button" onclick={() => (showAll = !showAll)}>
				{showAll ? 'View less' : 'View all'}
			</button>
		{/if}
	</div>
	{#if tasks.length === 0}
		<p class="text-3xl opacity-30">No tasks</p>
	{:else}
		<ul class="flex flex-col gap-y-1">
			{#each visibleTasks as t (t.id)}
				<li>
					<TaskItem
						{hideUser}
						completed={t.completedAt != null}
						currentUserId={userId ?? -1}
						task={t}
						clickComplete={() => openComplete(t)}
						clickEdit={() => openEdit(t)}
						clickDelete={(t) => onDelete(t)}
					/>
				</li>
			{/each}
		</ul>
	{/if}
</section>
