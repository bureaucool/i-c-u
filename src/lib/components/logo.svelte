<script lang="ts">
	import { percentages } from '$lib/stores/states';

	let { title }: { title: string } = $props();

	$effect(() => {
		console.log($percentages);
	});
</script>

<div class="relative flex flex-col">
	<div class="relative z-10 flex flex-row text-5xl select-none">
		<div class="relative">
			<span class="relative left-0.5 opacity-50">🌈</span>
			<span class="absolute top-0 left-0.5 opacity-100">🌈</span>
		</div>
		<div class="relative">
			<span class="block rotate-y-180 transform opacity-50">🌈</span>
			<span class="absolute top-0 left-0 block rotate-y-180 transform opacity-100">🌈</span>
		</div>
	</div>
	<span
		class="relative -top-3 z-20 block text-center text-4xl leading-none mix-blend-soft-light select-none"
		>{title}</span
	>
</div>
