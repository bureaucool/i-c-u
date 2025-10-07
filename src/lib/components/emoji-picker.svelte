<script lang="ts">
	let {
		onPick,
		onClose,
		extras = []
	}: { onPick: (emoji: string) => void; onClose: () => void; extras?: string[] } = $props();

	let dialogRef: HTMLDialogElement | null = null;
	let manual = $state('');

	const common = $state<string[]>([
		'😀',
		'😁',
		'😂',
		'🤣',
		'😊',
		'😍',
		'🤔',
		'👍',
		'🙏',
		'✨',
		'🔥',
		'🍀',
		'🍕',
		'☕',
		'🏃',
		'📎',
		'💡',
		'🛠️'
	]);

	let merged = $state<string[]>([]);
	$effect(() => {
		const extra = (extras ?? []).filter((e): e is string => typeof e === 'string' && e.length > 0);
		merged = Array.from(new Set([...extra, ...common]));
	});

	function pickAndClose(e: string) {
		onPick(e);
		manual = '';
		if (dialogRef?.open) dialogRef.close();
	}

	function onCancel() {
		manual = '';
		if (dialogRef?.open) dialogRef.close();
	}
</script>

<dialog open bind:this={dialogRef} onclose={onClose}>
	{#if false}
		<div>
			<p>Pick an emoji</p>
			<!-- Device-native: user can open OS emoji keyboard here -->
			<input
				placeholder="Type or paste emoji"
				bind:value={manual}
				inputmode="text"
				style="font-size:1.5rem; width: 10rem;"
			/>
			<button type="button" onclick={() => manual && pickAndClose(manual)}>Use</button>
			<button type="button" onclick={onCancel}>Cancel</button>
		</div>
		<hr />
	{/if}
	<div>
		<div>
			{#each merged as e}
				<button type="button" onclick={() => pickAndClose(e)}>{e}</button>
			{/each}
		</div>
	</div>
</dialog>
