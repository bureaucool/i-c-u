<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children, data }: { children: any; data: { user: { id: number; name: string } | null } } =
		$props();

	$inspect(data);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if data.user}
	<nav>
		<a href="/insights">Insights</a>
		<a href="/settings">Settings</a>
	</nav>
{:else}
	<nav>
		<a href="/setup">Setup</a>
	</nav>
{/if}

{@render children?.()}
