<script lang="ts">
	let {
		children,
		onclick,
		grey = false,
		big = true
	}: { children: any; onclick: () => void; grey?: boolean; big?: boolean } = $props();
</script>

<button
	class="pointer-events-auto cursor-pointer rounded-2xl px-5 py-1 {big
		? 'text-2xl'
		: 'text-base'} {grey
		? 'bg-gray-200 text-gray-800'
		: 'bg-black text-white md:hover:bg-black/80'}"
	{onclick}>{@render children?.()}</button
>
