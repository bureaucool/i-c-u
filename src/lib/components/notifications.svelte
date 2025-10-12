<script lang="ts">
	import { notifications } from '$lib/stores/notifications';
	import Notification from './notification.svelte';
</script>

<div class="pointer-events-none fixed inset-x-0 top-0 z-50 flex gap-y-2">
	{#each $notifications as notification}
		<Notification {notification} />
	{/each}
</div>
