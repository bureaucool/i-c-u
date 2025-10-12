<script lang="ts">
	import { notificationsBig } from '$lib/stores/notifications';
	import NotificationBig from './notification-big.svelte';
</script>

<div class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
	{#each $notificationsBig as notification}
		<NotificationBig {notification} />
	{/each}
</div>
