<script lang="ts">
	let { size = 30, color = 'black' }: { size?: number; color?: string } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
	<path d="M5.81104 5.80907L24.1958 24.1939" stroke={color} stroke-width="5" />
	<path d="M24.1958 5.81607L5.81102 24.2008" stroke={color} stroke-width="5" />
</svg>
