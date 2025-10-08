<script lang="ts">
	import { useRaf } from '$lib/hooks/use-raf';
	import { sineInOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';

	let {
		x = 0,
		y = 0,
		distance = 10,
		children,
		onclick,
		classes = ''
	}: {
		x?: number;
		y?: number;
		distance?: number;
		children?: any;
		onclick?: () => void;
		classes?: string;
	} = $props();

	let addX = $state(0);
	let addY = $state(0);

	let hovered = $state(false);

	let speed = (Math.random() * 0.5 + 0.5) * 0.2 + 0.1;

	let amountX = Math.random() * 0.5 + 0.5;
	let amountY = Math.random() * 0.5 + 0.5;

	let offset = Math.random();

	let time = 0;

	useRaf((d) => {
		if (hovered) return;
		time += d * 0.003;
		addX = Math.cos(time * speed + offset * Math.PI * 2) * distance * amountX;
		addY = Math.sin(time * speed + offset * Math.PI * 2) * distance * amountY;
	});
</script>

<div
	{onclick}
	class="absolute -translate-x-1/2 {classes}"
	style="top: {y}px; left: {x}px;"
	onmouseenter={() => {
		hovered = true;
	}}
	onmouseleave={() => {
		hovered = false;
	}}
>
	<div
		in:fade|global={{ duration: 800, easing: sineInOut, delay: 500 }}
		out:fade|global={{ duration: 400, easing: sineInOut }}
	>
		<span style="transform: translate3d({addX}px, {addY}px, 0);" class="absolute top-0 left-0">
			{@render children?.()}
		</span>
	</div>
</div>
