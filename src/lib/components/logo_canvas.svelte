<script lang="ts">
	import { percentages } from '$lib/stores/states';
	import { onMount } from 'svelte';

	let { title }: { title: string } = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);
	let ctx = $state<CanvasRenderingContext2D | null>(null);

	let img = $state<HTMLImageElement | null>(null);

	const imageWidth = 512;
	const imageHeight = 240;

	const perc = 0.25;

	$effect(() => {
		console.log($percentages);
	});

	onMount(() => {
		canvas.width = imageWidth * perc;
		canvas.height = imageHeight * perc;
		ctx = canvas?.getContext('2d') as CanvasRenderingContext2D;
	});

	$effect(() => {
		if (ctx) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
			// ctx.globalCompositeOperation = 'multiply';
			ctx.globalAlpha = 0.5;

			// top right quarter
			ctx.beginPath();

			ctx.arc(canvas.width / 2, canvas.height, canvas.height, 1.5 * Math.PI, 2 * Math.PI); // from 0 to 90 degrees (radians)
			ctx.lineTo(canvas.width / 2, canvas.height); // close the shape to the center
			ctx.closePath();

			ctx.fillStyle = 'white';
			ctx.fill();
		}
	});
</script>

<div class="relative flex flex-col">
	<div class="relative z-10 flex flex-row text-5xl select-none">
		<img bind:this={img} src="/rainbow.png" class="pointer-events-none absolute opacity-0" />
		<canvas bind:this={canvas}></canvas>
	</div>
	<span
		class="relative -top-3 z-20 block text-center text-4xl leading-none mix-blend-soft-light select-none"
		>{title}</span
	>
</div>

<style>
	/* Ensure inline elements can be masked */
	.mask-rad--bl,
	.mask-rad--br {
		display: inline-block;
		line-height: 1;
		mask-mode: alpha;
		/* vendor */
		-webkit-mask-repeat: no-repeat;
		-webkit-mask-size: 100% 100%;
		/* standard */
		mask-repeat: no-repeat;
		mask-size: 100% 100%;
	}

	/* remove unused conic selectors */

	/* Radial quarter-circle fallback masks (robust for emoji) */
	.mask-rad--bl {
		/* grow a quarter circle from bottom-left */
		mask-image: radial-gradient(
			var(--r, 0em) var(--r, 0em) at 0% 100%,
			white 98%,
			transparent 100%
		);
		-webkit-mask-image: radial-gradient(
			var(--r, 0em) var(--r, 0em) at 0% 100%,
			white 98%,
			transparent 100%
		);
		-webkit-mask-position: left bottom;
		mask-position: left bottom;
		-webkit-mask-size: 100% 100%;
		mask-size: 100% 100%;
	}

	.mask-rad--br {
		/* grow a quarter circle from bottom-right */
		mask-image: radial-gradient(
			var(--r, 0em) var(--r, 0em) at 100% 100%,
			white 98%,
			transparent 100%
		);
		-webkit-mask-image: radial-gradient(
			var(--r, 0em) var(--r, 0em) at 100% 100%,
			white 98%,
			transparent 100%
		);
		-webkit-mask-position: right bottom;
		mask-position: right bottom;
		-webkit-mask-size: 100% 100%;
		mask-size: 100% 100%;
	}
</style>
