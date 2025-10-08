<script lang="ts">
	import '../app.css';

	import Logo from '$lib/components/logo_canvas.svelte';
	import { page } from '$app/state';
	import { fade } from 'svelte/transition';
	import { percentages, rangeDays } from '$lib/stores/states';

	let {
		children,
		data
	}: {
		children: any;
		data: {
			user: { id: number; name: string } | null;
			activeGroup?: { id: number; title: string } | null;
			groupId?: number | null;
			globalAdjustedPercentages?: [number, number];
			rangeDays?: number;
		};
	} = $props();

	let currentGroupTitle = $derived(data.activeGroup?.title ?? '');

	// Keep global stores in sync
	$effect(() => {
		percentages.set(data.globalAdjustedPercentages ?? [0, 0]);
		rangeDays.set(data.rangeDays ?? 7);
	});
</script>

<svelte:head>
	<title>I C U</title>
</svelte:head>

{#if data.user}
	<div class="pointer-events-none fixed inset-x-3 top-3 z-30 flex justify-center">
		<a href={page.url.pathname === '/' ? '/insights' : '/'} class="pointer-events-auto"
			><Logo title={currentGroupTitle} /></a
		>
	</div>
{/if}
{#key page.url.pathname}
	<div
		class="relative top-0 z-10 mx-auto max-w-xl px-10 py-32"
		in:fade|local={{ duration: 400, delay: 200 }}
		out:fade|local={{ duration: 200, delay: 0 }}
	>
		<div class="absolute inset-0 rounded-full bg-white blur-3xl"></div>
		<div class="relative z-10">
			{@render children?.()}
		</div>
	</div>
{/key}

<div class="rainbow-bg fixed inset-0"></div>
