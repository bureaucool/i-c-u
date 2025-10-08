<script lang="ts">
	import EmojiPicker from '$lib/components/emoji-picker.svelte';

	import type { Task, User } from '$lib/types';
	import Button from './button.svelte';

	let {
		task,
		users,
		extras = [],
		onSave,
		onCancel,
		onDelete,
		onDuplicate,
		mode = 'edit',
		allowDelete = true
	}: {
		task: Task | null;
		users: User[];
		extras?: string[];
		onSave: (payload: {
			title: string;
			emoji: string | null;
			assignedUserId: string | null;
			scheduledAt: number | null;
			recurrenceType: string | null;
			recurrenceInterval: number | null;
		}) => Promise<void> | void;
		onCancel: () => void;
		onDelete?: () => Promise<void> | void;
		onDuplicate?: () => Promise<void> | void;
		mode?: 'edit' | 'create' | 'duplicate';
		allowDelete?: boolean;
	} = $props();

	let title = $state(task?.title ?? '');
	let emoji = $state((task?.emoji ?? '') as string);
	let assignedUserId = $state(task?.assignedUserId ? String(task.assignedUserId) : '');
	let date = $state('');
	let time = $state('');
	if (task?.scheduledAt) {
		const d = new Date(Number(task.scheduledAt));
		date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
		time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
	}
	let recurrenceType = $state(((task as any)?.recurrenceType ?? '') as string);
	let recurrenceInterval = $state(
		((task as any)?.recurrenceInterval ?? '') ? String((task as any).recurrenceInterval) : ''
	);

	// API returns array of objects with at least an `emoji` string; be permissive
	let foundEmojis = $state<Array<{ emoji?: string; character?: string }>>([]);

	let showPicker = $state(false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		let scheduledAt: number | null = null;
		if (date) {
			const iso = time ? `${date}T${time}:00` : `${date}T00:00:00`;
			scheduledAt = new Date(iso).getTime();
		}
		await onSave({
			title,
			emoji: emoji || '📎',
			assignedUserId: assignedUserId || null,
			scheduledAt,
			recurrenceType: recurrenceType || null,
			recurrenceInterval: recurrenceInterval ? Number(recurrenceInterval) : null
		});
	}
</script>

{#if task}
	{#if mode === 'duplicate'}
		<p class="text-center text-3xl"><span class="opacity-30">Duplicate</span> {task.title}</p>
	{:else if mode === 'edit'}
		<p class="text-center text-3xl"><span class="opacity-30">Editing</span> {task.title}</p>
	{/if}
{/if}
<form onsubmit={submit} class="flex flex-col items-center gap-y-10">
	<div class="flex flex-col items-center gap-y-5">
		<div class="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 p-2">
			<input
				class="w-full text-center text-3xl"
				name="emoji"
				type={!emoji ? 'hidden' : 'text'}
				value={emoji ?? ''}
			/>
			{#if emoji === ''}
				<span class="text-center text-xs leading-tight opacity-50">Auto populated by title</span>
			{/if}
		</div>
		{#if foundEmojis.length > 0}
			<div class="max-w-48">
				{#each foundEmojis as emojiItem}
					<button
						type="button"
						class={emoji === (emojiItem.emoji || emojiItem.character || '')
							? 'rounded-2xl bg-white/80'
							: ''}
						onclick={() => (emoji = emojiItem.emoji || emojiItem.character || '')}
					>
						{emojiItem.emoji || emojiItem.character}
					</button>
				{/each}
			</div>
		{/if}
		{#if !showPicker}
			<div class="flex flex-row justify-center gap-x-1">
				<Button grey big={false} onclick={() => (showPicker = true)}>Browse</Button>
				<Button grey big={false} onclick={() => (emoji = '')} disabled={emoji === ''}>Clear</Button>
			</div>
		{/if}
		{#if showPicker}<Button grey big={false} onclick={() => (showPicker = false)}>hide</Button>{/if}
		{#if showPicker}
			<EmojiPicker
				onPick={(e) => {
					emoji = e;
					showPicker = false;
				}}
				onClose={() => {
					showPicker = false;
				}}
				{extras}
			/>
		{/if}
	</div>
	<div class="flex flex-col gap-y-0">
		<span>Title</span>
		<input
			class="text-3xl"
			placeholder="Title"
			required
			bind:value={title}
			disabled={mode === 'duplicate' && task != null}
			onblur={async () => {
				if (!task && title.trim().length > 0) {
					const tempEmoji = await fetch(`/api/emoji?title=${encodeURIComponent(title)}`);
					if (tempEmoji.ok) {
						const tempEmojiData = await tempEmoji.json();
						foundEmojis = tempEmojiData;
					}
				}
			}}
		/>
	</div>

	<div class="flex w-full flex-row gap-x-10">
		<div class="flex grow flex-col gap-y-0">
			<span>Date</span>
			<input type="date" class="w-60 text-3xl" bind:value={date} />
			{#if date}
				<button
					type="button"
					onclick={() => {
						date = '';
						time = '';
					}}>clear</button
				>
			{/if}
		</div>
		<div class="flex grow flex-col gap-y-0">
			<span>Time</span>
			<input type="time" bind:value={time} />
		</div>
	</div>
	<div class="flex w-full flex-col gap-y-0">
		<span>Recurrence</span>
		<select
			class="text-3xl"
			bind:value={recurrenceType}
			disabled={mode === 'duplicate' && task != null}
		>
			<option value="">One-time</option>
			<option value="daily">Daily</option>
			<option value="weekly">Weekly</option>
			<option value="monthly">Monthly</option>
			<option value="every_x_days">Every X days</option>
			<option value="every_x_weeks">Every X weeks</option>
			<option value="every_x_months">Every X months</option>
		</select>
	</div>
	<div class={recurrenceType.includes('every_x_') ? 'flex w-full flex-col gap-y-0' : 'hidden'}>
		<span>Every</span>
		<input
			class="text-3xl"
			type="number"
			min="1"
			placeholder="X"
			bind:value={recurrenceInterval}
			disabled={mode === 'duplicate' && task != null}
		/>
	</div>

	<div class="flex w-full flex-col gap-y-0">
		<span>Assigned to</span>
		<select
			class="text-3xl"
			bind:value={assignedUserId}
			disabled={mode === 'duplicate' && task != null}
		>
			<option value="">Unassigned</option>
			{#each users as u}
				<option value={String(u.id)}>{u.name}</option>
			{/each}
		</select>
	</div>
	<div class="flex w-full flex-row justify-center gap-x-2">
		<Button grey type="submit">Save</Button>
		<Button onclick={onCancel}>Cancel</Button>
		{#if task && allowDelete}
			<Button
				red
				onclick={async () => {
					if (confirm('Delete this task?')) {
						await onDelete?.();
					}
				}}>Delete</Button
			>
		{/if}
		{#if task && onDuplicate && mode === 'edit'}
			<Button grey onclick={() => onDuplicate?.()}>Duplicate</Button>
		{/if}
	</div>
</form>
