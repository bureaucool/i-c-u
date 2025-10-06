<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<nav>
	<a href="/">Home</a>
	<a href="/insights">Insights</a>
	<a href="/settings">Settings</a>
	<a href="/admin">Admin</a>
</nav>

{@render children?.()}
