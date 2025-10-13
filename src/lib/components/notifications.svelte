<script lang="ts">
	import { notifications } from '$lib/stores/notifications';
	import Notification from './notification.svelte';
</script>

<div class="pointer-events-none fixed inset-x-0 top-0 z-[70] flex w-full justify-center gap-y-2">
	{#each $notifications as notification (notification.id)}
		<Notification {notification} />
	{/each}
</div>
