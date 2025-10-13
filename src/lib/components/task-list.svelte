<script lang="ts">
	import type { Task } from '$lib/types';
	import TaskItem from './task-item.svelte';

	let {
		tasks,
		title,
		userId,
		hideUser = false,
		openComplete,
		openEdit,
		onDelete
	}: {
		tasks: Task[];
		title: string;
		userId: number;
		hideUser?: boolean;
		openComplete: (task: Task) => void;
		openEdit: (task: Task) => void;
		onDelete: (task: Task) => void;
	} = $props();
</script>

<section>
	<h2 class="mb-2">{title}</h2>
	{#if tasks.length === 0}
		<p class="text-3xl opacity-30">No tasks</p>
	{:else}
		<ul class="flex flex-col gap-y-1">
			{#each tasks as t (t.id)}
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
