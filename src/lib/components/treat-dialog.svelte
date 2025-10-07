<script lang="ts">
	import type { User } from '$lib/types';

	let {
		users,
		onSave,
		onCancel
	}: {
		users: User[];
		onSave: (payload: {
			title: string;
			toUserId: string;
			valueMinutes: string;
		}) => Promise<void> | void;
		onCancel: () => void;
	} = $props();

	let title = $state('');
	let toUserId = $state('');
	let valueMinutes = $state('');

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		await onSave({ title, toUserId, valueMinutes });
	}
</script>

<form class="flex flex-col gap-y-2" onsubmit={submit}>
	<input name="title" placeholder="Title" required bind:value={title} />
	<select name="toUserId" required bind:value={toUserId}>
		<option value="" disabled selected>Select recipient</option>
		{#each users as u}
			<option value={u.id}>{u.name}</option>
		{/each}
	</select>
	<input
		name="valueMinutes"
		type="number"
		min="1"
		placeholder="Value (minutes)"
		required
		bind:value={valueMinutes}
	/>
	<div class="flex flex-row justify-center gap-x-5">
		<button type="submit">Create</button>
		<button type="button" onclick={onCancel}>Cancel</button>
	</div>
</form>
