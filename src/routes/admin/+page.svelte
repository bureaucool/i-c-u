<script lang="ts">
	import Button from '$lib/components/button.svelte';
	let {
		data
	}: {
		data: {
			groups: { id: number; title: string }[];
			membersByGroup: Record<number, { id: number; name: string; email: string | null }[]>;
		};
	} = $props();

	let msg = $state<string | null>(null);
	let err = $state<string | null>(null);
</script>

<div class="flex flex-col gap-y-10">
	<section>
		<h2 class="">Create Group</h2>
		<form
			class="flex flex-col gap-2"
			onsubmit={async (e) => {
				e.preventDefault();
				msg = err = null;
				const form = new FormData(e.currentTarget as HTMLFormElement);
				const res = await fetch('?/createGroup', { method: 'POST', body: form });
				if (res.ok) msg = 'Group created';
				else err = 'Failed to create group';
				if (res.ok) location.reload();
			}}
		>
			<input class="text-3xl" name="title" placeholder="New group title" required />
			<div>
				<Button type="submit">Create</Button>
			</div>
		</form>
		{#if msg}<p>{msg}</p>{/if}
		{#if err}<p>{err}</p>{/if}
	</section>

	<section>
		<h2>Groups</h2>
		{#if (data.groups ?? []).length === 0}
			<p>No groups.</p>
		{:else}
			<ul class="mt-5 flex flex-col gap-6">
				{#each data.groups as g}
					<li class="flex flex-col gap-5 rounded-lg bg-black/5 p-4">
						<div class=" text-3xl">{g.title}</div>
						<div>
							<div class="text-sm opacity-60">Members</div>
							<ul class=" flex flex-col">
								{#each data.membersByGroup[g.id] ?? [] as m}
									<li>{m.name} <span class="opacity-60">({m.email})</span></li>
								{/each}
							</ul>
						</div>
						<div class="flex items-center gap-3">
							<form
								onsubmit={async (e) => {
									e.preventDefault();
									if (
										!confirm(
											`Delete group "${g.title}"? This also removes users who only belong to this group.`
										)
									)
										return;
									msg = err = null;
									const form = new FormData(e.currentTarget as HTMLFormElement);
									const res = await fetch('?/deleteGroup', { method: 'POST', body: form });
									if (res.ok) msg = 'Group deleted';
									else err = 'Failed to delete group';
									if (res.ok) location.reload();
								}}
							>
								<input type="hidden" name="groupId" value={g.id} />
								<Button type="submit" red={true}>Delete group</Button>
							</form>
						</div>
						<form
							class="flex flex-col"
							onsubmit={async (e) => {
								e.preventDefault();
								msg = err = null;
								const form = new FormData(e.currentTarget as HTMLFormElement);
								const res = await fetch('?/addMember', { method: 'POST', body: form });
								if (res.ok) msg = 'Member added';
								else err = 'Failed to add member';
								if (res.ok) location.reload();
							}}
						>
							<input type="hidden" name="groupId" value={g.id} />

							<input class="text-3xl" name="name" placeholder="Name" />

							<input
								class="text-3xl"
								name="email"
								type="email"
								placeholder="user@example.com"
								required
							/>

							<input
								class="text-3xl"
								placeholder="Password"
								name="password"
								type="password"
								required
							/>
							<div class="mt-5">
								<Button type="submit">Add member</Button>
							</div>
						</form>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
