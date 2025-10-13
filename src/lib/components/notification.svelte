<script lang="ts">
	import { removeNotification } from '$lib/stores/notifications';
	import type { Notification } from '$lib/types';
	import { onMount } from 'svelte';
	import { sineInOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';

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

<button
	aria-label={'notification'}
	class="pointer-events-auto flex flex-row items-center justify-center gap-x-2 rounded-b-lg bg-white px-4 py-2 leading-none"
	onclick={() => {
		timeO && clearTimeout(timeO);
		removeNotification(notification);
	}}
	transition:fade={{ duration: 200, easing: sineInOut }}
>
	{#if notification.type === 'success'}
		<div class="">✅</div>
	{:else if notification.type === 'error'}
		<div class="">❌</div>
	{:else}
		<div class="">ℹ️</div>
	{/if}
	<p class="text-sm">{notification.message}</p>
</button>
