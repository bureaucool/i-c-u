<script lang="ts">
	import type { Task } from '$lib/types';
	import MiniTag from './mini-tag.svelte';
	import { beautifyDate } from '$lib/helpers';
	import { isMobile, isTouch } from '$lib/stores/device';
	import IconMinus from './icon-minus.svelte';
	import IconPlus from './icon-plus.svelte';
	import IconRemove from './icon-remove.svelte';
	import SubtaskItem from './subtask-item.svelte';

	let {
		task,
		completed = false,
		clickComplete,
		clickEdit,
		clickDelete,
		hideUser = false,
		currentUserId = -1
	}: {
		task: Task;
		completed?: boolean;
		clickComplete: () => void;
		clickEdit: () => void;
		clickDelete: (task: Task) => void;
		hideUser?: boolean;
		currentUserId?: number;
	} = $props();

	let hovered = $state(false);
	let showDetails = $state(false);

	function formatScheduledDate(timestamp: number): string {
		const date = new Date(timestamp);
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = String(date.getFullYear());
		const hours = date.getHours();
		const minutes = date.getMinutes();
		const base = `${day}.${month}.${year}`;
		if (hours !== 0 || minutes !== 0) {
			const hh = String(hours).padStart(2, '0');
			const mm = String(minutes).padStart(2, '0');
			return `${base} ${hh}:${mm}`;
		}
		return base;
	}

	let deleting = $state(false);
</script>

<div
	class="pointer-events-auto flex flex-col gap-y-1 {deleting
		? 'animate-[pulse_1s_ease-in-out_infinite]'
		: ''}"
>
	<div
		class="relative flex flex-row items-center gap-x-3 rounded-full border border-neutral-300 px-6 py-2"
	>
		{#if !completed}
			<button
				aria-label="Complete task"
				class=" flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 md:hover:scale-110 {completed
					? 'border-neutral-700 bg-neutral-700'
					: ''}"
				onclick={clickComplete}>&nbsp;</button
			>
		{/if}
		<div>
			<span class="flex-0 text-4xl">{task.emoji}</span>
		</div>

		<button
			class=" flex w-full cursor-pointer flex-col items-start md:hover:opacity-50"
			onclick={clickEdit}
			onmouseenter={() => !$isMobile && !$isTouch && (hovered = true)}
			onmouseleave={() => !$isMobile && !$isTouch && (hovered = false)}
		>
			<div class="flex w-full flex-row gap-x-2 text-3xl leading-none">
				<div class="flex flex-col items-start justify-start gap-y-1">
					<span class="block text-left">{task.title}</span>

					<div class="flex w-full flex-row flex-wrap gap-0.5">
						{#if !hideUser && task.assignedUserId != null && task.assignedUserId === currentUserId}
							<MiniTag big>You</MiniTag>
						{/if}
						{#if task.scheduledAt}
							{@const dateInfo = beautifyDate(task.scheduledAt)}
							<MiniTag big bg="bg-green-100" text="text-green-700" title={dateInfo.formatted}
								>{dateInfo.relative}</MiniTag
							>
							<MiniTag big bg="bg-neutral-100" text="text-neutral-500"
								>{formatScheduledDate(task.scheduledAt)}</MiniTag
							>
						{:else}
							<MiniTag big bg="bg-neutral-100" text="text-neutral-500">Whenever</MiniTag>
						{/if}
						{#if task.subtasks && task.subtasks.length > 0}
							<MiniTag big bg="bg-green-100" text="text-neutral-500"
								>{task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} tasks</MiniTag
							>
						{/if}
					</div>
				</div>
			</div>
		</button>

		{#if (task.description || (task.subtasks && task.subtasks.length > 0)) && !completed}
			<button
				class="shrink-0 text-xl opacity-50 hover:opacity-100"
				onclick={() => (showDetails = !showDetails)}
			>
				{#if showDetails}
					<IconMinus size={20} />
				{:else}
					<IconPlus size={20} />
				{/if}
			</button>
		{/if}

		{#if completed && (hovered || $isTouch)}
			<div class="absolute inset-y-0 right-8 z-30 flex flex-col items-center justify-center">
				<button
					class="cursor-pointer text-2xl"
					onclick={() => {
						if (!confirm('Delete this task?')) return;
						deleting = true;
						clickDelete(task);
						hovered = false;
					}}><IconRemove /></button
				>
			</div>
		{/if}
	</div>

	{#if showDetails && !completed}
		<div class=" flex flex-col gap-y-2 rounded-full border border-neutral-200 p-4 px-6">
			{#if task.description}
				<div class="flex flex-col gap-y-1">
					<p class="whitespace-pre-wrap text-neutral-700">{task.description}</p>
				</div>
			{/if}

			{#if task.subtasks && task.subtasks.length > 0}
				<div class="flex flex-col gap-y-1">
					<div class="flex flex-col gap-y-1">
						{#each task.subtasks as subtask (subtask.id)}
							<SubtaskItem
								{task}
								{subtask}
								onToggle={(taskId, updated) => {
									// update task.subtasks locally
									task = {
										...task,
										subtasks: (task.subtasks ?? []).map((s) =>
											s.id === updated.id ? { ...s, completed: updated.completed } : s
										)
									} as any;
								}}
							/>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
