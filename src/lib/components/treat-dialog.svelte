<script lang="ts">
	import type { User } from '$lib/types';
	import Button from './button.svelte';

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

<form class="flex flex-col gap-y-10" onsubmit={submit}>
	<div class="flex flex-col gap-y-0">
		<span>Title</span>
		<input class="text-3xl" name="title" placeholder="Title" required bind:value={title} />
	</div>

	<div class="flex flex-col gap-y-0">
		<span>For</span>
		<select class="text-3xl" name="toUserId" required bind:value={toUserId}>
			<option value="" disabled selected>Select</option>
			{#each users as u}
				<option value={u.id}>{u.name}</option>
			{/each}
		</select>
	</div>

	<div class="flex flex-col gap-y-0">
		<span>Duration</span>
		<input
			class="text-3xl"
			name="valueMinutes"
			type="number"
			min="1"
			placeholder="Minutes"
			required
			bind:value={valueMinutes}
		/>
	</div>
	<div class="flex flex-row justify-center gap-x-1">
		<Button grey type="submit">Create</Button>
		<Button onclick={onCancel}>Cancel</Button>
	</div>
</form>
