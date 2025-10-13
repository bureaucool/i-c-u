<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import Button from '$lib/components/button.svelte';
	import MiniTag from '$lib/components/mini-tag.svelte';
	import { addNotification } from '$lib/stores/notifications';

	type GroupLite = { id: number; title: string };
	type UserLite = { id: number; name: string };
	let {
		data
	}: {
		data: {
			user?: { id: number; name: string } | null;
			groupId?: number | null;
			groups?: GroupLite[];
			users?: UserLite[];
			members?: { id: number; name: string; email: string | null }[];
		};
	} = $props();

	let currentGroupTitle = $derived(data.groups?.find((g) => g.id === data.groupId)?.title ?? '');

	let editMembers = $state<boolean>(false);
	let editTitle = $state<boolean>(false);

	// Check if user arrived from password reset
	onMount(() => {
		if ($page.url.searchParams.get('reset_success') === 'true') {
			addNotification({
				id: Date.now().toString(),
				createdAt: Date.now(),
				message: 'You can now change your password below.',
				type: 'success'
			});
			// Clean up URL
			const url = new URL(window.location.href);
			url.searchParams.delete('reset_success');
			window.history.replaceState({}, '', url);
		}
	});
</script>

<div class="pointer-events-none fixed inset-x-0 bottom-3 z-40 md:top-3">
	<div class="mx-auto flex max-w-xl justify-end px-7">
		<a href="/" aria-label="Settings" class="pointer-events-auto p-3"
			><div class="h-3 w-3 rounded-full bg-black/30 md:hover:bg-black"></div></a
		>
	</div>
</div>

<div class="flex flex-col gap-y-10">
	<section class="">
		<form
			onsubmit={async (e) => {
				e.preventDefault();

				const form = new FormData(e.currentTarget as HTMLFormElement);
				const res = await fetch('?/updateGroup', { method: 'POST', body: form });
				if (res.ok)
					addNotification({
						id: Date.now().toString(),
						createdAt: Date.now(),
						message: 'Group title updated',
						type: 'success'
					});
				else
					addNotification({
						id: Date.now().toString(),
						createdAt: Date.now(),
						message: 'Failed to update group',
						type: 'error'
					});

				editTitle = false;
				await invalidateAll();
			}}
		>
			<input name="groupId" type="hidden" value={data.groupId} />
			<div class="flex w-full flex-row items-center justify-between">
				<span class="text-neutral-500">Group title</span>
				{#if !editTitle}
					<Button
						big={false}
						onclick={() => {
							editTitle = true;
						}}>Edit</Button
					>
				{:else}
					<div class="flex flex-row gap-x-1">
						<Button big={false} type="submit">Save</Button>
						<Button
							big={false}
							grey
							onclick={() => {
								editTitle = false;
							}}>Cancel</Button
						>
					</div>
				{/if}
			</div>

			{#if !editTitle}
				<div class="text-3xl">{currentGroupTitle}</div>
			{:else}
				<div>
					<input class="text-3xl" name="title" placeholder={currentGroupTitle} required />
				</div>
			{/if}
		</form>
	</section>

	<section>
		<div class="flex flex-row items-center justify-between">
			<h3 class="text-neutral-500">Members</h3>
			{#if !editMembers}
				<Button
					big={false}
					onclick={() => {
						editMembers = true;
					}}>Add</Button
				>
			{/if}
		</div>
		{#if (data.members ?? []).length === 0}
			<p>No members in this group.</p>
		{:else}
			<ul>
				{#each data.members ?? [] as m (m.id)}
					<li class="flex flex-row items-end justify-between">
						<span class="relative flex flex-row items-end gap-x-2"
							><span class="text-3xl">{m.name}</span>
							{#if m.id === data.user?.id}
								<div class="absolute -top-3 -left-3 -translate-x-1/2">
									<MiniTag>you</MiniTag>
								</div>
							{/if}
							{#if m.email}<span class="opacity-50">{m.email}</span>{/if}</span
						>
						<Button
							big={false}
							grey
							onclick={async () => {
								const form = new FormData();
								form.set('userId', String(m.id));
								const res = await fetch('?/removeMember', { method: 'POST', body: form });
								if (res.ok) {
									addNotification({
										id: Date.now().toString(),
										createdAt: Date.now(),
										message: 'Member removed',
										type: 'success'
									});
									await invalidateAll();
								} else {
									addNotification({
										id: Date.now().toString(),
										createdAt: Date.now(),
										message: 'Failed to remove member',
										type: 'error'
									});
								}
							}}>Remove</Button
						>
					</li>
				{/each}
			</ul>
			{#if editMembers}
				<section>
					<form
						class="flex flex-col text-3xl"
						onsubmit={async (e) => {
							e.preventDefault();

							const form = new FormData(e.currentTarget as HTMLFormElement);
							const res = await fetch('?/addMember', { method: 'POST', body: form });
							if (res.ok) {
								addNotification({
									id: Date.now().toString(),
									createdAt: Date.now(),
									message: 'Member added to the group',
									type: 'success'
								});
								await invalidateAll();
							} else {
								addNotification({
									id: Date.now().toString(),
									createdAt: Date.now(),
									message: 'Failed to add member',
									type: 'error'
								});
							}

							editMembers = false;
							await invalidateAll();
						}}
					>
						<input name="name" placeholder="Name (optional)" />
						<input name="email" type="email" placeholder="Email" required />
						<input name="password" type="password" placeholder="Password" required />
						<div>
							<Button type="submit" big={false}>Add member</Button>
							<Button
								big={false}
								grey
								onclick={() => {
									editMembers = false;
								}}>Cancel</Button
							>
						</div>
					</form>
				</section>
			{/if}
		{/if}
	</section>

	<section>
		<h3 class="text-neutral-500">User Availability (minutes/week)</h3>
		<form
			class="flex flex-row items-center justify-between"
			onsubmit={async (e) => {
				e.preventDefault();

				const form = new FormData(e.currentTarget as HTMLFormElement);
				const res = await fetch('?/updateAvailability', { method: 'POST', body: form });
				if (res.ok)
					addNotification({
						id: Date.now().toString(),
						createdAt: Date.now(),
						message: 'Availability updated',
						type: 'success'
					});
				else
					addNotification({
						id: Date.now().toString(),
						createdAt: Date.now(),
						message: 'Failed to update availability',
						type: 'error'
					});
			}}
		>
			<input type="hidden" name="userId" value={data.user?.id} />
			<input
				class="w-full text-3xl"
				name="availableTimeMinutesPerWeek"
				type="number"
				placeholder={(data.user as any)?.availableTimeMinutesPerWeek ?? 600}
				required
			/>
			<div>
				<Button big={false} type="submit">Save</Button>
			</div>
		</form>
	</section>

	<section>
		<h3 class="text-neutral-500">Change Password</h3>
		<form
			class="flex flex-row items-center justify-between"
			onsubmit={async (e) => {
				e.preventDefault();

				const form = new FormData(e.currentTarget as HTMLFormElement);
				const res = await fetch('?/changePassword', { method: 'POST', body: form });
				if (res.ok)
					addNotification({
						id: Date.now().toString(),
						createdAt: Date.now(),
						message: 'Password changed',
						type: 'success'
					});
				else
					addNotification({
						id: Date.now().toString(),
						createdAt: Date.now(),
						message: 'Failed to change password',
						type: 'error'
					});
			}}
		>
			<input
				class="w-full text-3xl"
				name="newPassword"
				type="password"
				placeholder="New password"
				required
			/>
			<div>
				<Button big={false} type="submit">Change</Button>
			</div>
		</form>
	</section>

	<section class="mt-10 flex flex-row justify-end">
		<Button
			big={false}
			onclick={async () => {
				await fetch('/api/auth', { method: 'DELETE' });
				await invalidateAll();
				await goto('/');
			}}>Logout</Button
		>
	</section>

	{#if data.groups?.length && data.groups.length > 1}
		<section>
			<h3 class="text-neutral-500">Active Groups</h3>
			<form
				onsubmit={async (e) => {
					e.preventDefault();

					const form = new FormData(e.currentTarget as HTMLFormElement);
					const res = await fetch('?/selectGroup', { method: 'POST', body: form });
					if (res.ok)
						addNotification({
							id: Date.now().toString(),
							createdAt: Date.now(),
							message: 'Active group updated',
							type: 'success'
						});
					else
						addNotification({
							id: Date.now().toString(),
							createdAt: Date.now(),
							message: 'Failed to set active group',
							type: 'error'
						});
				}}
			>
				<select name="groupId">
					{#each data.groups ?? [] as g (g.id)}
						<option
							class="text-3xl"
							value={g.id}
							selected={data.groupId != null && g.id === data.groupId}
							>{g.title}
						</option>
					{/each}
				</select>
				<Button big={false} type="submit">Use this group</Button>
			</form>
		</section>
	{/if}
</div>
