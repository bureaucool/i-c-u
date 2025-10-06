<script lang="ts">
	let { data } = $props();
</script>

<h2>Settings</h2>

<section>
	<h3>Group Title</h3>
	<form method="POST" action="?/updateGroup">
		<select name="groupId">
			{#each data.groups as g}
				<option value={g.id}>{g.title}</option>
			{/each}
		</select>
		<input name="title" placeholder="New title" required />
		<button type="submit">Save</button>
	</form>
</section>

<section>
	<h3>User Availability (minutes/week)</h3>
	<form method="POST" action="?/updateAvailability">
		<select name="userId">
			{#each data.users as u}
				<option value={u.id}>{u.name}</option>
			{/each}
		</select>
		<input name="availableTimeMinutesPerWeek" type="number" required />
		<button type="submit">Save</button>
	</form>
</section>

<section>
	<h3>Change Password</h3>
	<form method="POST" action="?/changePassword">
		<input name="newPassword" type="password" placeholder="New password" required />
		<button type="submit">Change</button>
	</form>
</section>
