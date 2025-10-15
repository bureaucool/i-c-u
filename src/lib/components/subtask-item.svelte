<script lang="ts">
	import { addNotification } from '$lib/stores/notifications';
	import type { Subtask, Task } from '$lib/types';
	import DistributeAnimation from './distribute-animation.svelte';
	let {
		task,
		subtask,
		onToggle
	}: { task: Task; subtask: Subtask; onToggle: (taskId: number, subtask: Subtask) => void } =
		$props();

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

			// optimistic toggle for this item only
			const prevCompleted = subtask.completed;
			const nextCompleted = !prevCompleted;
			const prevSubtask = { ...subtask };
			subtask = { ...subtask, completed: nextCompleted } as any;
			try {
				const res = await fetch(`/api/tasks/${task.id}/subtasks/${subtask.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ completed: nextCompleted })
				});
				if (!res.ok) throw new Error('Failed');
				const updated = (await res.json()) as Subtask;
				if (nextCompleted) {
					activateAnimation = true;
				}
				// bubble up so parent can merge into local state lists
				onToggle?.(task.id, updated);
				clicked = false;
			} catch (e) {
				// revert on error
				subtask = prevSubtask as any;
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
