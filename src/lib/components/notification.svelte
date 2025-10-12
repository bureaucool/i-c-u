<script lang="ts">
	import { removeNotification } from '$lib/stores/notifications';
	import type { Notification } from '$lib/types';
	import { onMount } from 'svelte';

	let {
		notification
	}: {
		notification: Notification;
	} = $props();

	let timeO: ReturnType<typeof setTimeout> | null = null;
	onMount(() => {
		timeO = setTimeout(() => {
			removeNotification(notification);
		}, 3000);

		return () => {
			timeO && clearTimeout(timeO);
		};
	});
</script>

<div
	class="flex flex-row items-center justify-center gap-x-2 rounded-b-lg bg-white p-4 leading-none"
>
	{#if notification.type === 'success'}
		<div class="">✅</div>
	{:else if notification.type === 'error'}
		<div class="">❌</div>
	{:else}
		<div class="">ℹ️</div>
	{/if}
	<p class="text-sm">{notification.message}</p>
</div>
