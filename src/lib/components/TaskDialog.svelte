<script lang="ts">
	import EmojiPicker from '$lib/components/emoji-picker.svelte';
	import type { Task, User } from '$lib/types';

	let {
		task,
		users,
		extras = [],
		onSave,
		onCancel
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

<form onsubmit={submit}>
	<input placeholder="Title" required bind:value={title} />
	<div>
		<input name="emoji" type={!emoji ? 'hidden' : 'text'} value={emoji ?? ''} />
		<button type="button" onclick={() => (showPicker = true)}>browse</button>
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
	<input type="date" bind:value={date} />
	<input type="time" bind:value={time} />
	<select bind:value={recurrenceType}>
		<option value="">One-time</option>
		<option value="daily">Daily</option>
		<option value="weekly">Weekly</option>
		<option value="monthly">Monthly</option>
		<option value="every_x_days">Every X days</option>
		<option value="every_x_weeks">Every X weeks</option>
		<option value="every_x_months">Every X months</option>
	</select>
	<input type="number" min="1" placeholder="X" bind:value={recurrenceInterval} />
	<select bind:value={assignedUserId}>
		<option value="">Unassigned</option>
		{#each users as u}
			<option value={u.id}>{u.name}</option>
		{/each}
	</select>
	<button type="submit">Save</button>
	<button type="button" onclick={onCancel}>Cancel</button>
	{#if task}
		<p>Editing task #{task.id}</p>
	{/if}
</form>
