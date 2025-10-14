<script lang="ts">
	import { onMount } from 'svelte';
	import { sineOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	let {
		icon,
		amount = 30,
		onHidden,
		duration = 2000,
		distance = 100
	}: { icon: string; amount?: number; onHidden?: () => void; duration?: number } = $props();

	let randomPositions = $state<{ x: number; y: number; visible: boolean }[]>([]);

	for (let i = 0; i < amount; i++) {
		randomPositions.push({
			x: Math.random() * 100,
			y: Math.random() * 100,
			visible: true
		});
	}

	onMount(() => {
		setTimeout(() => {
			onHidden?.();
		}, duration);
	});
</script>

<div class="pointer-events-none absolute inset-0 rounded-full">
	{#each randomPositions as position}
		{#if position.visible}
			<div
				class="absolute"
				style="left: {position.x}%; top: {position.y}%;"
				in:fly|global={{
					x: -distance * (Math.random() * 0.8 + 0.2),
					duration: duration * 0.5 * (Math.random() * 0.8 + 0.2),
					easing: sineOut
				}}
				out:fly|global={{
					x: distance * (Math.random() * 0.8 + 0.2),
					duration: duration * 0.5 * (Math.random() * 0.8 + 0.2),
					easing: sineOut
				}}
				onintroend={() => {
					position.visible = false;
				}}
				onoutroend={() => {
					position.visible = false;
				}}
			>
				<span class="">{icon}</span>
			</div>
		{/if}
	{/each}
</div>
