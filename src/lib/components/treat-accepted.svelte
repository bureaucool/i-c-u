<script lang="ts">
	import type { Treat } from '$lib/types';

	let {
		tr,
		acknowledgeAccepted
	}: {
		tr: Treat;
		acknowledgeAccepted: (id: number) => void;
	} = $props();
</script>

<div class="flex items-center gap-x-3 rounded-full bg-white p-3 shadow">
	<span class="text-3xl">{tr.emoji ?? '♥️'}</span>
	<div class="flex flex-col">
		<strong>Accepted</strong>
		<span class="opacity-80">{tr.title} ({tr.valueMinutes} min)</span>
	</div>
	<button class="ml-2" onclick={() => acknowledgeAccepted(tr.id)}>Dismiss</button>
</div>
