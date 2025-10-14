<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { Subtask, Task } from '$lib/types';
	import DistributeAnimation from './distribute-animation.svelte';
	let { task, subtask }: { task: Task; subtask: Subtask } = $props();

	let activateAnimation = $state(false);
</script>

<div class="relative flex flex-row items-center gap-x-2">
	<button
		aria-label="Toggle subtask"
		class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {subtask.completed
			? 'border-neutral-700 bg-neutral-700'
			: 'border-neutral-700'}"
		type="button"
		onclick={async () => {
			// optimistic toggle with reactive reassignment
			const prevCompleted = subtask.completed;
			const nextCompleted = !prevCompleted;
			const before = (task.subtasks ?? []).map((st) => ({ ...st }));
			task = {
				...task,
				subtasks: (task.subtasks ?? []).map((st) =>
					st.id === subtask.id ? { ...st, completed: nextCompleted } : st
				)
			} as any;
			try {
				await fetch(`/api/tasks/${task.id}/subtasks/${subtask.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ completed: nextCompleted })
				});

				if (nextCompleted) {
					activateAnimation = true;
				}
				invalidateAll();
			} catch (e) {
				// revert on error
				task = { ...task, subtasks: before } as any;
			}
		}}
	>
	</button>
	<span class="text-base {subtask.completed ? 'line-through opacity-50' : ''}">{subtask.title}</span
	>

	{#if activateAnimation}
		<DistributeAnimation icon="🔥" onHidden={() => (activateAnimation = false)} />
	{/if}
</div>
