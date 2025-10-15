<script lang="ts">
	import EmojiPicker from '$lib/components/emoji-picker.svelte';

	import type { Task, User } from '$lib/types';
	import Button from './button.svelte';

	import IconRemove from './icon-remove.svelte';

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
			description: string | null;
			subtasks: Array<{ title: string; orderNumber: number; completed: boolean }>;
		}) => Promise<void> | void;
		onCancel: () => void;
		onDelete?: () => Promise<void> | void;
		onDuplicate?: () => Promise<void> | void;
		mode?: 'edit' | 'create' | 'duplicate';
		allowDelete?: boolean;
	} = $props();

	let title = $state('');
	let emoji = $state('');
	let assignedUserId = $state('');
	let date = $state('');
	let time = $state('');
	let recurrenceType = $state('');
	let recurrenceInterval = $state('');
	let description = $state('');
	let subtasks = $state<Array<{ title: string; orderNumber: number; completed: boolean }>>([]);

	let saving = $state(false);

	// Initialize/update state when task prop changes
	$effect(() => {
		title = task?.title ?? '';
		emoji = (task?.emoji ?? '') as string;
		assignedUserId = task?.assignedUserId ? String(task.assignedUserId) : '';

		if (task?.scheduledAt) {
			const d = new Date(Number(task.scheduledAt));
			date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
		} else {
			date = '';
			time = '';
		}

		recurrenceType = ((task as any)?.recurrenceType ?? '') as string;
		recurrenceInterval =
			((task as any)?.recurrenceInterval ?? '') ? String((task as any).recurrenceInterval) : '';
		description = task?.description ?? '';
		subtasks =
			task?.subtasks?.map((st) => ({
				title: st.title,
				orderNumber: st.orderNumber,
				completed: st.completed
			})) ?? [];
	});

	// API returns array of objects with at least an `emoji` string; be permissive
	let foundEmojis = $state<Array<{ emoji?: string; character?: string }>>([]);

	let showPicker = $state(false);
	let showEmojiField = $state(mode === 'edit' ? true : false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		saving = true;
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
			recurrenceInterval: recurrenceInterval ? Number(recurrenceInterval) : null,
			description: description.trim() || null,
			subtasks: subtasks.filter((st) => st.title.trim() !== '')
		});
		saving = false;
	}

	function addSubtask() {
		subtasks = [...subtasks, { title: '', orderNumber: subtasks.length, completed: false }];
	}

	function removeSubtask(index: number) {
		subtasks = subtasks.filter((_, i) => i !== index);
		// Re-order remaining subtasks
		subtasks = subtasks.map((st, i) => ({ ...st, orderNumber: i }));
	}

	function toggleSubtask(index: number) {
		subtasks[index] = { ...subtasks[index], completed: !subtasks[index].completed };
	}
</script>

{#if !saving}
	{#if task}
		{#if mode === 'duplicate'}
			<p class="text-center text-3xl">
				<span class="opacity-30">Duplicate</span>&nbsp;{task.title}
			</p>
		{:else if mode === 'edit'}
			<p class="text-center text-3xl"><span class="opacity-30">Editing</span>&nbsp;{task.title}</p>
		{/if}
	{/if}
	<form onsubmit={submit} class="flex flex-col items-center gap-y-10">
		<div class="flex flex-col items-center gap-y-5" class:hidden={!showEmojiField}>
			<div
				class="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 p-2"
			>
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

			{#if !showPicker}
				{#if foundEmojis.length > 0}
					<div
						class="mx-5 flex max-h-32 max-w-60 flex-wrap gap-1 overflow-y-auto rounded-2xl border border-neutral-300 px-3 py-2"
					>
						{#each foundEmojis as emojiItem}
							<button
								type="button"
								class="px-2 {emoji === (emojiItem.emoji || emojiItem.character || '')
									? 'rounded-2xl bg-white/80'
									: ''}"
								onclick={() => (emoji = emojiItem.emoji || emojiItem.character || '')}
							>
								{emojiItem.emoji || emojiItem.character}
							</button>
						{/each}
					</div>
				{/if}
				<div class="flex flex-row justify-center gap-x-1">
					<Button type="button" grey big={false} onclick={() => (showPicker = true)}>Browse</Button>
					<Button
						type="button"
						grey
						big={false}
						onclick={() => (emoji = '')}
						disabled={emoji === ''}>Clear</Button
					>
				</div>
			{/if}
			{#if showPicker}<Button type="button" grey big={false} onclick={() => (showPicker = false)}
					>Hide</Button
				>{/if}
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
		<div class="flex w-full flex-col gap-y-0">
			<span class="text-neutral-500">Title</span>
			<input
				class="w-full text-3xl"
				placeholder="Title"
				required
				bind:value={title}
				disabled={mode === 'duplicate' && task != null}
				onblur={async () => {
					if (
						((!task && mode === 'create') || mode === 'edit' || mode === 'duplicate') &&
						title.trim().length > 0
					) {
						showEmojiField = true;
						const tempEmoji = await fetch(`/api/emoji?title=${encodeURIComponent(title)}`);
						if (tempEmoji.ok) {
							const tempEmojiData = await tempEmoji.json();
							foundEmojis = tempEmojiData;
							if (tempEmojiData.length > 0) {
								emoji = tempEmojiData[0].emoji || tempEmojiData[0].character || '';
							}
						}
					}
				}}
			/>
		</div>

		<div class="flex w-full flex-row gap-x-10">
			<div class="flex grow flex-col gap-y-0">
				<span class="text-neutral-500">Date</span>
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
				<span class="text-neutral-500">Time</span>
				<input type="time" bind:value={time} />
			</div>
		</div>
		<div class="flex w-full flex-col gap-y-0">
			<span class="text-neutral-500">Recurrence</span>
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
			<span class="text-neutral-500">Every</span>
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
			<span class="text-neutral-500">Assigned to</span>
			<select
				class="text-3xl"
				bind:value={assignedUserId}
				disabled={mode === 'duplicate' && task != null}
			>
				<option value="">Unassigned</option>
				{#each users as u (u.id)}
					<option value={String(u.id)}>{u.name}</option>
				{/each}
			</select>
		</div>

		<div class="flex w-full flex-col gap-y-0">
			<span class="text-neutral-500">Description</span>
			<textarea
				class="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xl"
				placeholder="Add a description..."
				rows="3"
				bind:value={description}
			></textarea>
		</div>

		<div class="flex w-full flex-col gap-y-2">
			<div class="flex flex-row items-center justify-between">
				<span class="text-neutral-500">Subtasks</span>
				<Button type="button" grey big={false} onclick={addSubtask}>+ Add Subtask</Button>
			</div>
			{#if subtasks.length > 0}
				<div class="flex w-full flex-col gap-y-2">
					{#each subtasks as subtask, index (index)}
						<div class="flex w-full flex-row items-center gap-x-2">
							<button
								type="button"
								class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {subtask.completed
									? 'border-neutral-300'
									: 'border-neutral-300 bg-neutral-300'}"
								onclick={() => toggleSubtask(index)}
							>
							</button>
							<input
								type="text"
								class="w-full rounded-lg border border-neutral-300 px-2 py-1 text-lg {subtask.completed
									? 'line-through opacity-50'
									: ''}"
								placeholder="Subtask title..."
								bind:value={subtask.title}
							/>
							<button type="button" onclick={() => removeSubtask(index)}>
								<IconRemove color="white" size={20} />
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="flex w-full flex-row flex-wrap justify-center gap-2">
			<Button grey type="submit">Save</Button>

			{#if task && onDuplicate && mode === 'edit'}
				<Button type="button" grey onclick={() => onDuplicate?.()}>Duplicate</Button>
			{/if}
			{#if task && allowDelete}
				<Button
					type="button"
					red
					onclick={async () => {
						if (confirm('Delete this task?')) {
							await onDelete?.();
						}
					}}>Delete</Button
				>
			{/if}
			<Button type="button" onclick={onCancel}>Close</Button>
		</div>
	</form>
{:else}
	<div class="my-10 text-center text-3xl">Saving...</div>
{/if}
