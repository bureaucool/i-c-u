<script lang="ts">
	import type { Task } from '$lib/types';
	import MiniTag from './mini-tag.svelte';
	import { beautifyDate } from '$lib/helpers';

	let {
		task,
		completed = false,
		clickComplete,
		clickEdit,
		hideUser = false,
		currentUserId = -1
	}: {
		task: Task;
		completed?: boolean;
		clickComplete: () => void;
		clickEdit: () => void;
		hideUser?: boolean;
		currentUserId?: number;
	} = $props();

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
</script>

<div class="flex flex-row items-center gap-x-3 rounded-full border border-neutral-300 px-6 py-2">
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
	>
		<div class="flex w-full flex-row gap-x-2 text-3xl leading-none">
			<div class="flex flex-col items-start justify-start gap-y-1">
				<span class="block text-left">{task.title}</span>

				<div class="flex w-full flex-row gap-x-0.5">
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
				</div>
			</div>
		</div>
	</button>
</div>
