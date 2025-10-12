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
	class="pointer-events-auto flex cursor-pointer items-center justify-center {big
		? 'rounded-2xl px-5 py-1 text-3xl '
		: 'rounded-lg px-3 py-1 text-base leading-none'} {grey
		? 'bg-neutral-200 text-gray-800 text-shadow-[-5px_0px_10px__rgb(50_50_50_/_0.5)] md:hover:bg-neutral-200/50'
		: red
			? 'bg-red-500 text-white md:hover:bg-red-500/50'
			: 'bg-black text-white  text-shadow-[-5px_0px_10px__rgb(250_250_250_/_0.8)] md:hover:bg-neutral-500/50'} {disabled
		? 'pointer-events-none opacity-50'
		: ''}"
	{onclick}>{@render children?.()}</button
>
