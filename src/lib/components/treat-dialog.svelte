<script lang="ts">
	import type { User } from '$lib/types';
	import Button from './button.svelte';

	let {
		users,
		currentUserId,
		onSave,
		onCancel
	}: {
		users: User[];
		currentUserId?: number;
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

	let saving = $state(false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		saving = true;
		await onSave({ title, toUserId, valueMinutes });
		saving = false;
	}
</script>

{#if !saving}
	<form class="flex flex-col gap-y-10" onsubmit={submit}>
		<div class="flex flex-col gap-y-0">
			<span class="text-neutral-500">Title</span>
			<input class="text-3xl" name="title" placeholder="Title" required bind:value={title} />
		</div>

		<div class="flex flex-col gap-y-0">
			<span class="text-neutral-500">For</span>
			<select class="text-3xl" name="toUserId" required bind:value={toUserId}>
				<option value="" disabled selected>Select</option>
				{#each users.filter((u) => u.id !== (currentUserId ?? -1)) as u (u.id)}
					<option value={u.id}>{u.name}</option>
				{/each}
			</select>
		</div>

		<div class="flex flex-col gap-y-0">
			<span class="text-neutral-500">Duration</span>
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
{:else}
	<div class="my-10 text-center text-3xl">Saving...</div>
{/if}
