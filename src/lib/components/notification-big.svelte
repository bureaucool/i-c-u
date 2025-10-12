<script lang="ts">
	import { removeNotificationBig } from '$lib/stores/notifications';
	import type { NotificationBig } from '$lib/types';
	import { onMount } from 'svelte';
	import { elasticOut, sineInOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';

	let {
		notification
	}: {
		notification: NotificationBig;
	} = $props();

	onMount(() => {
		setTimeout(() => {
			removeNotificationBig(notification);
		}, 1000);
	});
</script>

<div
	class="text-[10rem]"
	in:fly={{ duration: 1000, y: 100, easing: elasticOut }}
	out:fade={{ duration: 300, easing: sineInOut }}
>
	{notification.message}
</div>
