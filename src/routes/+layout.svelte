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
	<div class="fixed inset-x-3 top-3 z-30 flex justify-center">
		<a href={page.url.pathname === '/' ? '/insights' : '/'}><Logo title={currentGroupTitle} /></a>
	</div>

	<!-- {#if page.url.pathname === '/'}
		<div class="pointer-events-none fixed inset-0 top-3 z-40">
			<div class="mx-auto flex max-w-xl justify-end px-7">
				<form class="pointer-events-auto flex items-center gap-2 p-3" method="GET">
					<label class="opacity-60" for="range-select">Range</label>
					<select
						id="range-select"
						name="range"
						class="rounded border border-black/20 bg-white/80 px-2 py-1"
					>
						<option value="7" selected={data.rangeDays !== 30}>Last 7 days</option>
						<option value="30" selected={data.rangeDays === 30}>Last 30 days</option>
					</select>
					<noscript><button>Apply</button></noscript>
				</form>
				<a aria-label="Settings" class="pointer-events-auto p-3" href="/settings"
					><div class="h-3 w-3 rounded-full bg-black/30 md:hover:bg-black"></div></a
				>
			</div>
		</div>
	{/if} -->
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
bg
