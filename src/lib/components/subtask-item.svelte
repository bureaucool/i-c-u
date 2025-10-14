<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { addNotification } from '$lib/stores/notifications';
	import type { Subtask, Task } from '$lib/types';
	import DistributeAnimation from './distribute-animation.svelte';
	let { task, subtask }: { task: Task; subtask: Subtask } = $props();

	let activateAnimation = $state(false);
	let clicked = $state(false);
</script>

<div class="relative flex flex-row items-center gap-x-2">
	<button
		aria-label="Toggle subtask"
		class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full {subtask.completed ||
		clicked
			? ' bg-neutral-700'
			: 'border-2 border-neutral-700'} {clicked
			? 'pointer-events-none animate-[pulse_1s_ease-in-out_infinite]'
			: 'cursor-pointer'}"
		type="button"
		onclick={async () => {
			clicked = true;

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
				await invalidateAll();

				clicked = false;
			} catch (e) {
				// revert on error
				task = { ...task, subtasks: before } as any;
				addNotification({
					id: Date.now().toString(),
					createdAt: Date.now(),
					message: 'Failed to update subtask',
					type: 'error'
				});
				clicked = false;
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
