<script lang="ts">
	let {
		taskTitle,
		onSave,
		onCancel
	}: {
		taskTitle: string;
		onSave: (minutes: number) => Promise<void> | void;
		onCancel: () => void;
	} = $props();
	let minutes = $state<number | null>(null);
	let saving = $state(false);
	function close() {
		onCancel();
	}
	async function submit(e: SubmitEvent) {
		e.preventDefault();
		saving = true;
		await onSave(Number(minutes ?? 0) || 0);
		saving = false;
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') close();
	}}
/>

<div class="fixed inset-0 flex items-center justify-center bg-black/50">
	<button
		aria-label="Close"
		class="absolute inset-0"
		onclick={(e) => {
			if (e.currentTarget === e.target) close();
		}}
	></button>
	<div class="w-full max-w-md rounded bg-white p-4 shadow">
		{#if !saving}
			<h3>Complete task</h3>
			<p>{taskTitle}</p>
			<form onsubmit={submit}>
				<input type="number" min="0" step="1" placeholder="Minutes" bind:value={minutes} />
				<button type="submit">Save</button>
				<button type="button" onclick={close}>Cancel</button>
			</form>
		{:else}
			<div class="my-10 text-center text-3xl">Saving...</div>
		{/if}
	</div>
</div>
