<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { createSupabaseBrowser } from '$lib/supabaseClient';

	let msg = $state<string | null>(null);
	let err = $state<string | null>(null);
	let newPassword = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let sessionVerified = $state(false);

	onMount(async () => {
		// Check if user has a valid session from OTP verification
		const supabase = createSupabaseBrowser();
		const { data } = await supabase.auth.getSession();

		if (!data?.session) {
			err = 'No active session. Please click the reset link from your email again.';
		} else {
			sessionVerified = true;
		}
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

		loading = true;
		try {
			const supabase = createSupabaseBrowser();

			// Update the password (user is already authenticated via OTP)
			const { error: updateError } = await supabase.auth.updateUser({
				password: newPassword
			});

			if (updateError) throw updateError;

			msg = 'Password updated successfully! Redirecting to login...';
			newPassword = '';
			confirmPassword = '';

			// Sign out and redirect to home
			setTimeout(async () => {
				await supabase.auth.signOut();
				goto('/');
			}, 2000);
		} catch (e: any) {
			err = e?.message || 'Failed to update password';
		} finally {
			loading = false;
		}
	}
</script>

<section class="flex min-h-screen flex-col items-center justify-center gap-y-4 p-6 text-center">
	<h1 class="text-3xl">Set New Password</h1>

	{#if sessionVerified && !msg}
		<p class="text-sm opacity-60">Your identity has been verified. Please set a new password.</p>
		<form class="flex w-full max-w-sm flex-col gap-y-2" onsubmit={handleSubmit}>
			<input
				type="password"
				placeholder="New password (min 8 chars)"
				bind:value={newPassword}
				minlength="8"
				required
				disabled={loading}
			/>
			<input
				type="password"
				placeholder="Confirm new password"
				bind:value={confirmPassword}
				minlength="8"
				required
				disabled={loading}
			/>
			<button type="submit" disabled={loading}>
				{loading ? 'Updating...' : 'Set new password'}
			</button>
		</form>
	{/if}

	{#if msg}
		<p class="text-green-600">{msg}</p>
	{/if}

	{#if err}
		<p class="text-red-600">{err}</p>
		<a class="underline" href="/">Back to home</a>
	{/if}
</section>
