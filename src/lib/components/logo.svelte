<script lang="ts">
	import { percentages } from '$lib/stores/states';

	let { title }: { title: string } = $props();

	$effect(() => {
		console.log($percentages);
	});
</script>

<div class="relative flex flex-col">
	<div class="relative z-10 flex flex-row text-5xl select-none">
		<span class="relative left-0.5">🌈</span>
		<span class="block rotate-y-180 transform">🌈 </span>
	</div>
	<span
		class="relative -top-3 z-20 block text-center text-4xl leading-none mix-blend-soft-light select-none"
		>{title}</span
	>
</div>
