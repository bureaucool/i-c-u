<script lang="ts">
	let { size = 30, color = 'black' }: { size?: number; color?: string } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
	<path d="M2 15H28" stroke={color} stroke-width="5" />
</svg>
