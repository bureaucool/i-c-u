<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';

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

	let addMemberOpen = $state<boolean>(false);
</script>

<div class="pointer-events-none fixed inset-0 top-3 z-40">
	<div class="mx-auto flex max-w-xl justify-end">
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

<div class="mx-auto flex max-w-xl flex-col gap-y-10 px-10 py-20">
	<section class="">
		<h2 class="mb-10">Settings</h2>
		<form
			onsubmit={async (e) => {
				e.preventDefault();
				groupMsg = groupErr = null;
				const form = new FormData(e.currentTarget as HTMLFormElement);
				const res = await fetch('?/updateGroup', { method: 'POST', body: form });
				if (res.ok) groupMsg = 'Group title updated';
				else groupErr = 'Failed to update group';
			}}
		>
			<input name="groupId" type="hidden" value={data.groupId} />
			<div>Group title</div>
			{#each data.groups ?? [] as g}
				{#if g.id === data.groupId}
					<div>{g.title}</div>
				{/if}
			{/each}

			<input name="title" placeholder="New title" required />
			<button type="submit">Save</button>
		</form>
		{#if groupMsg}<p>{groupMsg}</p>{/if}
		{#if groupErr}<p>{groupErr}</p>{/if}
	</section>

	<section>
		<h3>
			Group Members <span
				class="ml-2"
				onclick={() => {
					addMemberOpen = true;
				}}>Add</span
			>
		</h3>
		{#if (data.members ?? []).length === 0}
			<p>No members in this group.</p>
		{:else}
			<ul>
				{#each data.members ?? [] as m}
					<li>
						{m.name}
						{#if m.email}<span class="opacity-50">({m.email})</span>{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	{#if addMemberOpen}
		<section>
			<h3>Add Member</h3>
			<form
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

					setTimeout(() => {
						addMemberOpen = false;
					}, 1000);
				}}
			>
				<input name="name" placeholder="Name (optional)" />
				<input name="email" type="email" placeholder="Email" required />
				<input name="password" type="password" placeholder="Password" required />
				<button type="submit">Add</button>
			</form>
			{#if memberMsg}<p>{memberMsg}</p>{/if}
			{#if memberErr}<p>{memberErr}</p>{/if}
		</section>
	{/if}

	<section>
		<h3>User Availability (minutes/week)</h3>
		<form
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
				name="availableTimeMinutesPerWeek"
				type="number"
				placeholder={(data.user as any)?.availableTimeMinutesPerWeek ?? 600}
				required
			/>
			<button type="submit">Save</button>
		</form>
		{#if availMsg}<p>{availMsg}</p>{/if}
		{#if availErr}<p>{availErr}</p>{/if}
	</section>

	<section>
		<h3>Change Password</h3>
		<form
			onsubmit={async (e) => {
				e.preventDefault();
				pwdMsg = pwdErr = null;
				const form = new FormData(e.currentTarget as HTMLFormElement);
				const res = await fetch('?/changePassword', { method: 'POST', body: form });
				if (res.ok) pwdMsg = 'Password changed';
				else pwdErr = 'Failed to change password';
			}}
		>
			<input name="newPassword" type="password" placeholder="New password" required />
			<button type="submit">Change</button>
		</form>
		{#if pwdMsg}<p>{pwdMsg}</p>{/if}
		{#if pwdErr}<p>{pwdErr}</p>{/if}
	</section>

	{#if data.groups?.length && data.groups.length > 1}
		<section>
			<h3>Active Group</h3>
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
						<option value={g.id} selected={data.groupId != null && g.id === data.groupId}
							>{g.title} (#{g.id})</option
						>
					{/each}
				</select>
				<button type="submit">Use this group</button>
			</form>
			{#if groupMsg}<p>{groupMsg}</p>{/if}
			{#if groupErr}<p>{groupErr}</p>{/if}
		</section>
	{/if}
</div>
