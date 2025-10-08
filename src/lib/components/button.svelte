<script lang="ts">
	let {
		children,
		type = null,
		onclick,
		grey = false,
		big = true
	}: {
		children: any;
		onclick?: () => void;
		grey?: boolean;
		big?: boolean;
		type?: 'button' | 'submit' | 'reset' | null;
	} = $props();
</script>

<button
	type={type ? type : undefined}
	class="pointer-events-auto cursor-pointer rounded-2xl {big
		? 'px-5 py-1 text-3xl'
		: 'px-3 py-1 text-base leading-none'} {grey
		? 'bg-gray-200 text-gray-800'
		: 'bg-black text-white md:hover:bg-black/80'}"
	{onclick}>{@render children?.()}</button
>
