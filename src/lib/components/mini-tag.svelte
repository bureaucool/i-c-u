<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children
	}: {
		children: Snippet;
	} = $props();
</script>

<span class=" rounded bg-amber-100/90 px-2 py-0.5 text-[0.5rem] text-amber-500 uppercase"
	>{@render children?.()}</span
>
