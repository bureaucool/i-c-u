<script lang="ts">
	import { onMount } from 'svelte';
	import { createSupabaseBrowser } from '$lib/supabaseClient';

	let msg: string | null = null;
	let err: string | null = null;
	let newPassword = '';
	let confirmPassword = '';
	let sessionEstablished = false;
	let loading = true;

	onMount(async () => {
		loading = true;
		try {
			const supabase = createSupabaseBrowser();

			// Handle PKCE flow (modern Supabase Auth approach)
			const urlParams = new URLSearchParams(
				typeof window !== 'undefined' ? window.location.search : ''
			);
			const code = urlParams.get('code');

			if (code) {
				// Exchange the code for a session
				const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
				if (exchangeError) {
					err =
						exchangeError.message ||
						'Failed to establish recovery session. Please use a fresh link.';
					loading = false;
					return;
				}
				if (data?.session) {
					sessionEstablished = true;
					loading = false;
					return;
				}
			}

			// Fallback: handle legacy token-based flow (hash fragments)
			const hash = typeof window !== 'undefined' ? window.location.hash : '';
			const hashParams = new URLSearchParams(hash?.startsWith('#') ? hash.slice(1) : hash);
			const accessToken = hashParams.get('access_token');
			const refreshToken = hashParams.get('refresh_token');

			if (accessToken && refreshToken) {
				const { data, error: sessionError } = await supabase.auth.setSession({
					access_token: accessToken,
					refresh_token: refreshToken
				});
				if (sessionError) {
					err = sessionError.message || 'Failed to establish session.';
					loading = false;
					return;
				}
				if (data?.session) {
					sessionEstablished = true;
					loading = false;
					return;
				}
			}

			// Final check: verify if we have an existing session
			const { data: sessionData } = await supabase.auth.getSession();
			if (sessionData?.session) {
				sessionEstablished = true;
			} else {
				err = 'Auth session missing. Please reopen the reset link from your email.';
			}
		} catch (e: any) {
			err = e?.message || 'An unexpected error occurred. Please try again.';
		} finally {
			loading = false;
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

			// Double-check session exists before attempting update
			const { data: sessionData } = await supabase.auth.getSession();
			if (!sessionData?.session) {
				throw new Error('Auth session expired. Please request a new password reset link.');
			}

			// Update the password
			const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
			if (updateError) throw updateError;

			// Sign out to force fresh login with new password
			await supabase.auth.signOut();

			msg = 'Password updated successfully! You can now log in with your new password.';
			newPassword = '';
			confirmPassword = '';
			sessionEstablished = false;
		} catch (e: any) {
			err = e?.message || 'Failed to update password';
		} finally {
			loading = false;
		}
	}
</script>

<section class="flex min-h-screen flex-col items-center justify-center gap-y-4 p-6 text-center">
	<h1 class="text-3xl">Reset password</h1>

	{#if loading && !sessionEstablished && !err}
		<p class="text-gray-600">Verifying reset link...</p>
	{:else if sessionEstablished && !msg}
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
		<a class="underline" href="/">Go to login</a>
	{/if}

	{#if err}
		<p class="text-red-600">{err}</p>
	{/if}

	{#if !msg}
		<a class="underline" href="/">Back to home</a>
	{/if}
</section>
