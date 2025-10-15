<script lang="ts">
	import { percentages } from '$lib/stores/states';
	import { onMount } from 'svelte';
	import { Spring } from 'svelte/motion';

	let { title }: { title: string } = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);
	let ctx = $state<CanvasRenderingContext2D | null>(null);

	let img = $state<HTMLImageElement | null>(null);

	const imageWidth = 512;
	const imageHeight = 240;

	const perc = 0.25;
	const DPR = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

	// $effect(() => {
	// 	console.log($percentages);
	// });

	let easedPercentages = new Spring($percentages, { stiffness: 0.1, damping: 10 });

	$effect(() => {
		easedPercentages.set($percentages);
	});

	onMount(() => {
		if (!canvas) return;
		const cssW = imageWidth * perc;
		const cssH = imageHeight * perc;
		canvas.style.width = cssW + 'px';
		canvas.style.height = cssH + 'px';
		canvas.width = Math.round(cssW * DPR);
		canvas.height = Math.round(cssH * DPR);
		ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
		if (ctx && DPR !== 1) ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
	});

	function draw() {
		if (!ctx || !canvas || !img || !img.complete) return;
		const width = canvas.width / DPR;
		const height = canvas.height / DPR;
		ctx.clearRect(0, 0, width, height);

		// Draw the base rainbow image
		ctx.drawImage(img, 0, 0, width, height);

		// Build a mask from two arc sectors (left and right halves)
		ctx.save();
		ctx.globalCompositeOperation = 'destination-out';
		ctx.fillStyle = '#000';
		ctx.globalAlpha = 0.9;

		const centerX = width / 2;
		const centerY = height; // bottom center
		const radius = height; // reaches top at y=0

		const leftProgress = Math.max(0, Math.min(1, (easedPercentages.current?.[0] || 0) / 100));
		const rightProgress = Math.max(0, Math.min(1, (easedPercentages.current?.[1] || 0) / 100));

		// Left half: spans from π (180°) to 3π/2 (270°)
		// Erase portion based on progress (less progress = more erased)
		if (leftProgress < 1) {
			ctx.beginPath();
			ctx.moveTo(centerX, centerY);
			ctx.arc(
				centerX,
				centerY,
				radius,
				Math.PI + (Math.PI / 2) * leftProgress,
				Math.PI + Math.PI / 2,
				false
			);
			ctx.closePath();
			ctx.fill();
		}

		// Right half: spans from 3π/2 (270°) to 2π (360°)
		// Erase portion based on progress (less progress = more erased)
		if (rightProgress < 1) {
			ctx.beginPath();
			ctx.moveTo(centerX, centerY);
			ctx.arc(
				centerX,
				centerY,
				radius,
				1.5 * Math.PI,
				1.5 * Math.PI + (Math.PI / 2) * (1 - rightProgress),
				false
			);
			ctx.closePath();
			ctx.fill();
		}

		ctx.restore();
	}

	$effect(() => {
		if (!ctx) return;
		if (img && !img.complete) {
			img.onload = () => draw();
			return;
		}
		draw();
	});
</script>

<div class="relative flex flex-col">
	<div class="relative z-10 flex flex-row text-5xl select-none">
		<img
			bind:this={img}
			src="/rainbow.png"
			alt="Rainbow"
			class="pointer-events-none absolute opacity-0"
		/>
		<canvas width={imageWidth} height={imageHeight} bind:this={canvas}></canvas>
		<span class="absolute bottom-0 left-0 -translate-x-full text-xs">You</span>
	</div>
	<span
		class="relative -top-3 z-20 block text-center font-script text-6xl leading-none mix-blend-soft-light select-none"
		>{title}</span
	>
</div>

<style>
	/* no additional styles required */
</style>
