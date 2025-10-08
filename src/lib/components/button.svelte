<script lang="ts">
	let {
		children,
		type = null,
		onclick,
		grey = false,
		red = false,
		big = true,
		disabled = false
	}: {
		children: any;
		onclick?: () => void;
		grey?: boolean;
		red?: boolean;
		big?: boolean;
		type?: 'button' | 'submit' | 'reset' | null;
		disabled?: boolean;
	} = $props();
</script>

<button
	{disabled}
	type={type ? type : undefined}
	class="pointer-events-auto cursor-pointer rounded-2xl {big
		? 'px-5 py-1 text-3xl'
		: 'px-3 py-1 text-base leading-none'} {grey
		? 'bg-neutral-200 text-gray-800 md:hover:bg-neutral-200/50'
		: red
			? 'bg-red-500 text-white md:hover:bg-red-500/50'
			: 'bg-black text-white md:hover:bg-neutral-500/50'} {disabled
		? 'pointer-events-none opacity-50'
		: ''}"
	{onclick}>{@render children?.()}</button
>
