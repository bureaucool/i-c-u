<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Logo from '$lib/components/logo.svelte';
	import { page } from '$app/state';

	let { children, data }: { children: any; data: { user: { id: number; name: string } | null } } =
		$props();
</script>

<svelte:head>
	<title>I C U</title>
	<!-- <link rel="icon" href={favicon} /> -->
</svelte:head>

{#if data.user}
	<div class="fixed inset-x-3 top-3 z-30 flex justify-center">
		<a href={page.url.pathname === '/' ? '/insights' : '/'}><Logo /></a>
	</div>

	{#if page.url.pathname === '/'}
		<a aria-label="Settings" class="fixed top-3 right-3 z-40 p-3" href="/settings"
			><div class="h-3 w-3 rounded-full bg-black/30 md:hover:bg-black"></div></a
		>
	{/if}
{/if}

{@render children?.()}
