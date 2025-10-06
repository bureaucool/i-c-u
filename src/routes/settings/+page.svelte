<script lang="ts">
	import { goto } from '$app/navigation';

	type GroupLite = { id: number; title: string };
	type UserLite = { id: number; name: string };
	let {
		data
	}: {
		data: { user?: { id: number; name: string } | null; groups?: GroupLite[]; users?: UserLite[] };
	} = $props();
	let groupMsg = $state<string | null>(null);
	let groupErr = $state<string | null>(null);
	let availMsg = $state<string | null>(null);
	let availErr = $state<string | null>(null);
	let pwdMsg = $state<string | null>(null);
	let pwdErr = $state<string | null>(null);
</script>

<h2>Settings</h2>

<button
	onclick={async () => {
		await fetch('/api/auth', { method: 'DELETE' });
		goto('/');
	}}>Logout</button
>

<section>
	<h3>Group Title</h3>
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
		<select name="groupId">
			{#each data.groups as g}
				<option value={g.id}>{g.title} (#{g.id})</option>
			{/each}
		</select>
		<input name="title" placeholder="New title" required />
		<button type="submit">Save</button>
	</form>
	{#if groupMsg}<p>{groupMsg}</p>{/if}
	{#if groupErr}<p>{groupErr}</p>{/if}
</section>

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
		<input name="availableTimeMinutesPerWeek" type="number" placeholder="e.g. 600" required />
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
