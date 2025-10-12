<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children = [],
		rotationSpeed = 3,
		rotationOffset = 30,
		animationDelay = 0.2
	}: {
		children?: String[];
		rotationSpeed?: number;
		rotationOffset?: number;
		animationDelay?: number;
	} = $props();

	function getStyle(index: number) {
		const delay = index * animationDelay;
		const offset = index * rotationOffset;
		return `
			animation-delay: ${delay}s;
			transform: rotateX(${offset}deg);
			--rotation-speed: ${rotationSpeed}s;
		`;
	}
</script>

<div class="rotating-container">
	{#each children as child, i}
		<div class="rotating-item" style={getStyle(i)}>
			{@html child}
		</div>
	{/each}
</div>

<style>
	.rotating-container {
		display: contents;
	}

	.rotating-item {
		animation: rotateX var(--rotation-speed, 3s) linear infinite;
		transform-style: preserve-3d;
		position: relative;
	}

	@keyframes rotateX {
		from {
			transform: rotateX(0deg);
		}
		to {
			transform: rotateX(360deg);
		}
	}
</style>
