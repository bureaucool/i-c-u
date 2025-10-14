<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		bg = 'bg-amber-100/90',
		text = 'text-amber-500',
		big = false,
		title = undefined
	}: {
		children: Snippet;
		bg?: string;
		big?: boolean;
		text?: string;
		title?: string;
	} = $props();
</script>

<span
	{title}
	class="rounded whitespace-nowrap {bg} {big
		? 'px-2 py-0.5 text-[0.8rem]'
		: 'px-2 py-0.5 text-[0.5rem]'} {text} uppercase">{@render children?.()}</span
>
