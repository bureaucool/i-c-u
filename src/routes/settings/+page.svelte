<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import Button from '$lib/components/button.svelte';

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
	let groupMsg = $state<string | null>(null);
	let groupErr = $state<string | null>(null);
	let availMsg = $state<string | null>(null);
	let availErr = $state<string | null>(null);
	let pwdMsg = $state<string | null>(null);
	let pwdErr = $state<string | null>(null);
	let memberMsg = $state<string | null>(null);
	let memberErr = $state<string | null>(null);

	let currentGroupTitle = $derived(data.groups?.find((g) => g.id === data.groupId)?.title ?? '');

	let editMembers = $state<boolean>(false);
	let editTitle = $state<boolean>(false);
</script>

<div class="pointer-events-none fixed inset-0 top-3 z-40">
	<div class="mx-auto flex max-w-xl justify-end px-7">
		<button
			class="pointer-events-auto flex cursor-pointer p-3 opacity-30 md:hover:opacity-100"
			onclick={async () => {
				await fetch('/api/auth', { method: 'DELETE' });
				await invalidateAll();
				await goto('/');
			}}>Logout</button
		>
	</div>
</div>

<div class="flex flex-col gap-y-10">
	<section class="">
		<form
			onsubmit={async (e) => {
				e.preventDefault();
				groupMsg = groupErr = null;
				const form = new FormData(e.currentTarget as HTMLFormElement);
				const res = await fetch('?/updateGroup', { method: 'POST', body: form });
				if (res.ok) groupMsg = 'Group title updated';
				else groupErr = 'Failed to update group';

				editTitle = false;
				await invalidateAll();
			}}
		>
			<input name="groupId" type="hidden" value={data.groupId} />
			<div class="flex w-full flex-row items-center justify-between">
				<span>Group title</span>
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
		{#if groupMsg}<p>{groupMsg}</p>{/if}
		{#if groupErr}<p>{groupErr}</p>{/if}
	</section>

	<section>
		<div class="flex flex-row items-center justify-between">
			<h3>Members</h3>
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
				{#each data.members ?? [] as m}
					<li class="flex flex-row items-end justify-between">
						<span class="flex flex-row items-end gap-x-2"
							><span class="text-3xl">{m.name}</span>
							{#if m.id === data.user?.id}<span
									class="rounded-2xl bg-black/20 px-2 py-0.25 text-white">You</span
								>{/if}
							{#if m.email}<span class="opacity-50">{m.email}</span>{/if}</span
						>
						<Button
							big={false}
							grey
							onclick={async () => {
								memberMsg = memberErr = null;
								const form = new FormData();
								form.set('userId', String(m.id));
								const res = await fetch('?/removeMember', { method: 'POST', body: form });
								if (res.ok) {
									memberMsg = 'Member removed';
									await invalidateAll();
								} else {
									memberErr = 'Failed to remove member';
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
							memberMsg = memberErr = null;
							const form = new FormData(e.currentTarget as HTMLFormElement);
							const res = await fetch('?/addMember', { method: 'POST', body: form });
							if (res.ok) {
								memberMsg = 'Member added';
								await invalidateAll();
							} else {
								memberErr = 'Failed to add member';
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
					{#if memberMsg}<p>{memberMsg}</p>{/if}
					{#if memberErr}<p>{memberErr}</p>{/if}
				</section>
			{/if}
		{/if}
	</section>

	<section>
		<h3>User Availability (minutes/week)</h3>
		<form
			class="flex flex-row items-center justify-between"
			onsubmit={async (e) => {
				e.preventDefault();
				availMsg = availErr = null;
				const form = new FormData(e.currentTarget as HTMLFormElement);
				const res = await fetch('?/updateAvailability', { method: 'POST', body: form });
				if (res.ok) availMsg = 'Availability updated';
				else availErr = 'Failed to update availability';
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
		{#if availMsg}<p>{availMsg}</p>{/if}
		{#if availErr}<p>{availErr}</p>{/if}
	</section>

	<section>
		<h3>Change Password</h3>
		<form
			class="flex flex-row items-center justify-between"
			onsubmit={async (e) => {
				e.preventDefault();
				pwdMsg = pwdErr = null;
				const form = new FormData(e.currentTarget as HTMLFormElement);
				const res = await fetch('?/changePassword', { method: 'POST', body: form });
				if (res.ok) pwdMsg = 'Password changed';
				else pwdErr = 'Failed to change password';
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
		{#if pwdMsg}<p>{pwdMsg}</p>{/if}
		{#if pwdErr}<p>{pwdErr}</p>{/if}
	</section>

	{#if data.groups?.length && data.groups.length > 1}
		<section>
			<h3>Active Groups</h3>
			<form
				onsubmit={async (e) => {
					e.preventDefault();
					groupMsg = groupErr = null;
					const form = new FormData(e.currentTarget as HTMLFormElement);
					const res = await fetch('?/selectGroup', { method: 'POST', body: form });
					if (res.ok) groupMsg = 'Active group updated';
					else groupErr = 'Failed to set active group';
				}}
			>
				<select name="groupId">
					{#each data.groups ?? [] as g}
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
			{#if groupMsg}<p>{groupMsg}</p>{/if}
			{#if groupErr}<p>{groupErr}</p>{/if}
		</section>
	{/if}
</div>
