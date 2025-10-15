<script lang="ts">
	import type { Treat } from '$lib/types';
	import { bounceOut, elasticOut, expoOut, sineInOut } from 'svelte/easing';
	import Button from './button.svelte';
	import { onDestroy, onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	let {
		tr,
		acceptingTreatId,
		onAccept,
		onUpdate
	}: {
		tr: Treat;
		acceptingTreatId: number | null;
		onAccept: (id: number) => void;
		onUpdate: (updated: Treat | { id: number; dismissed: true }) => void;
	} = $props();

	let acceptMinutes = $state<number | null>(null);
	let acceptFeedback = $state('');

	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});

	onDestroy(() => {
		mounted = false;
	});
</script>

{#if mounted}
	<div
		class="rounded-full bg-pink-100 p-10 shadow-xl"
		in:fly|global={{ duration: 1500, easing: elasticOut, y: 50, delay: 400 }}
		out:fade={{ duration: 200, easing: sineInOut }}
	>
		<div class="flex flex-col items-center gap-x-3">
			<div class="text-6xl">{(tr as any).emoji ?? '♥️'}</div>
			<div class="flex flex-col">
				<div class="text-3xl whitespace-nowrap">{(tr as any).title}</div>
			</div>
		</div>
		{#if acceptingTreatId === tr.id}
			<form
				class="mt-3 flex flex-col gap-y-2"
				onsubmit={async (e) => {
					e.preventDefault();
					const res = await fetch(`/api/treats/${tr.id}`, {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							accepted: true,
							valueMinutes: Number(acceptMinutes ?? tr.valueMinutes),
							feedbackNote: acceptFeedback || undefined
						})
					});
					if (res.ok) {
						const updated = await res.json().catch(() => null);
						if (updated) onUpdate(updated);
						acceptingTreatId = null;
						acceptMinutes = null;
						acceptFeedback = '';
					}
				}}
			>
				<label class="text-sm">Confirm minutes</label>
				<input
					type="number"
					min="0"
					step="1"
					bind:value={acceptMinutes}
					placeholder={String(tr.valueMinutes)}
				/>
				<input type="text" placeholder="Optional feedback" bind:value={acceptFeedback} />
				<div class="flex gap-x-2">
					<Button type="submit" big={false}>Accept</Button>
					<Button
						grey
						big={false}
						onclick={() => {
							acceptingTreatId = null;
						}}>Cancel</Button
					>
				</div>
			</form>
		{:else}
			<div class="mt-3 flex gap-x-2">
				<Button
					big={false}
					onclick={() => {
						onAccept(tr.id);
						acceptMinutes = tr.valueMinutes;
					}}>Accept</Button
				>
				<Button
					big={false}
					grey
					onclick={async () => {
						const res = await fetch(`/api/treats/${tr.id}`, {
							method: 'PATCH',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ accepted: false, declined: true })
						});
						if (res.ok) onUpdate({ id: tr.id, dismissed: true } as any);
					}}>Dismiss</Button
				>
			</div>
		{/if}
	</div>
{/if}
