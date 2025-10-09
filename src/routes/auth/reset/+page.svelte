<script lang="ts">
	import { onMount } from 'svelte';
	import { createSupabaseBrowser } from '$lib/supabaseClient';

	let msg: string | null = null;
	let err: string | null = null;
	let newPassword = '';
	let confirmPassword = '';
	let canSet = false;

	onMount(async () => {
		try {
			const supabase = createSupabaseBrowser();
			const { data } = await supabase.auth.getSession();
			// When arriving via reset link, user will have a short-lived session allowing password update
			canSet = !!data.session;
		} catch {}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		msg = err = null;
		if (newPassword.length < 8) {
			err = 'Password must be at least 8 characters';
			return;
		}
		if (newPassword !== confirmPassword) {
			err = 'Passwords do not match';
			return;
		}
		try {
			const supabase = createSupabaseBrowser();
			const { error } = await supabase.auth.updateUser({ password: newPassword });
			if (error) throw error;
			msg = 'Password updated. You can now log in.';
		} catch (e: any) {
			err = e?.message || 'Failed to update password';
		}
	}
</script>

<section class="flex min-h-screen flex-col items-center justify-center gap-y-4 p-6 text-center">
	<h1 class="text-3xl">Reset password</h1>
	{#if !canSet}
		<p>Open the reset link from your email to set a new password.</p>
	{:else}
		<form class="flex w-full max-w-sm flex-col gap-y-2" onsubmit={handleSubmit}>
			<input
				type="password"
				placeholder="New password (min 8 chars)"
				bind:value={newPassword}
				minlength="8"
				required
			/>
			<input
				type="password"
				placeholder="Confirm new password"
				bind:value={confirmPassword}
				minlength="8"
				required
			/>
			<button type="submit">Set new password</button>
		</form>
		{#if msg}<p>{msg}</p>{/if}
		{#if err}<p>{err}</p>{/if}
	{/if}
	<a class="underline" href="/">Back to home</a>
</section>
