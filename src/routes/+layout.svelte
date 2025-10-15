<script lang="ts">
	import '../app.css';

	import Logo from '$lib/components/logo_canvas.svelte';
	import { page } from '$app/state';
	import { fade } from 'svelte/transition';
	import { percentages, rangeDays } from '$lib/stores/states';
	import { createSupabaseBrowser } from '$lib';
	import { invalidateAll, invalidate } from '$app/navigation';
	import { browser } from '$app/environment';

	import Notifications from '$lib/components/notifications.svelte';
	import NotificationsBig from '$lib/components/notifications-big.svelte';

	let {
		children,
		data
	}: {
		children: any;
		data: {
			user: { id: number; name: string } | null;
			activeGroup?: { id: number; title: string } | null;
			groupId?: number | null;
			globalAdjustedPercentages?: [number, number];
			rangeDays?: number;
		};
	} = $props();

	let currentGroupTitle = $derived(data.activeGroup?.title ?? '');
	let isOnline = $state(true);

	// Track online/offline status
	$effect(() => {
		if (!browser) return;

		// Set initial status
		isOnline = navigator.onLine;

		const handleOnline = () => {
			isOnline = true;
		};

		const handleOffline = () => {
			isOnline = false;
		};

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	});

	// Keep global stores in sync
	$effect(() => {
		percentages.set(data.globalAdjustedPercentages ?? [0, 0]);
		rangeDays.set(data.rangeDays ?? 7);
	});

	// Listen to Supabase auth state changes and invalidate when auth changes
	$effect(() => {
		if (!browser) return;

		const supabase = createSupabaseBrowser();

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((event, session) => {
			// console.debug('[auth] state change', { event, hasSession: !!session });
			if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
				// Invalidate the specific auth dependency
				invalidate('supabase:auth');
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	});

	// Realtime: listen for changes to tasks and treats and invalidate (client-only)
	$effect(() => {
		if (!browser) return;
		if (!data.user || !data.groupId) return;

		const supabase = createSupabaseBrowser();

		let invalidateTimer: number | null = null;
		function scheduleInvalidate() {
			if (invalidateTimer != null) return;
			invalidateTimer = setTimeout(async () => {
				invalidateTimer = null;
				await invalidateAll();
			}, 200) as unknown as number;
		}

		// Use unique channel name per group - use separate channels for better debugging
		const taskChannelName = `group-${data.groupId}-tasks`;
		const treatChannelName = `group-${data.groupId}-treats`;

		const taskChannel = supabase
			.channel(taskChannelName)
			.on('postgres_changes', { event: '*', schema: 'public', table: 'task' }, (payload) => {
				// Client-side group filter
				const groupId = (payload.new as any)?.group_id || (payload.old as any)?.group_id;
				if (groupId !== data.groupId) return;
				// console.debug('[realtime] task event', {
				// 	channel: taskChannelName,
				// 	status: 'event',
				// 	eventType: payload.eventType,
				// 	new: payload.new,
				// 	old: payload.old
				// });
				scheduleInvalidate();
			})
			.subscribe((status) => {
				// console.debug('[realtime] task channel status', { channel: taskChannelName, status });
			});

		const treatChannel = supabase
			.channel(treatChannelName)
			.on('postgres_changes', { event: '*', schema: 'public', table: 'treat' }, (payload) => {
				// Client-side filter since server-side filter had issues
				const groupId = (payload.new as any)?.group_id || (payload.old as any)?.group_id;
				if (groupId === data.groupId) {
					// console.debug('[realtime] treat event', {
					// 	channel: treatChannelName,
					// 	status: 'event',
					// 	eventType: payload.eventType,
					// 	new: payload.new,
					// 	old: payload.old
					// });
					scheduleInvalidate();
				}
			})
			.subscribe((status) => {
				// console.debug('[realtime] treat channel status', { channel: treatChannelName, status });
			});

		return () => {
			supabase.removeChannel(taskChannel);
			supabase.removeChannel(treatChannel);
			if (invalidateTimer != null) clearTimeout(invalidateTimer as unknown as number);
		};
	});
</script>

<svelte:head>
	<title>I C U</title>
</svelte:head>

{#if data.user}
	<div class="pointer-events-none fixed inset-x-3 top-3 z-30 flex justify-center">
		<a class="pointer-events-auto" href="/"><Logo title={currentGroupTitle} /></a>
	</div>
{/if}
{#key page.url.pathname}
	<div
		class="relative top-0 z-10 mx-auto max-w-xl px-5 py-32 md:px-10"
		in:fade|local={{ duration: 400, delay: 200 }}
		out:fade|local={{ duration: 200, delay: 0 }}
	>
		<div class="absolute inset-0 rounded-full bg-white blur-3xl"></div>
		<div class="relative z-10">
			{@render children?.()}
		</div>
	</div>
{/key}

<!-- Offline Indicator -->
{#if !isOnline}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
		transition:fade={{ duration: 200 }}
	>
		<div class="mx-4 max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl">
			<div class="mb-4 text-6xl">📡</div>
			<h2 class="mb-2 text-2xl font-bold text-gray-900">You're Offline</h2>
			<p class="text-gray-600">Please check your internet connection to use this app.</p>
		</div>
	</div>
{/if}

<div class="rainbow-bg pointer-events-none fixed inset-0"></div>

<Notifications />
<NotificationsBig />
