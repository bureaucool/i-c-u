<script lang="ts">
	let { title }: { title: string } = $props();
</script>

<div class="relative flex flex-col">
	<div class="relative z-10 flex flex-row text-5xl select-none">
		<span>🌈</span>
		<span class="block rotate-y-180 transform">🌈 </span>
	</div>
	<span
		class="relative -top-3 z-20 block text-center text-4xl leading-none mix-blend-soft-light select-none"
		>{title}</span
	>
</div>
