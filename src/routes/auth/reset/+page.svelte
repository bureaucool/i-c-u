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

			// First, check if Supabase has already detected and set up the session from URL
			// This handles both hash fragments and query parameters automatically
			const { data: existingSession } = await supabase.auth.getSession();
			if (existingSession?.session) {
				sessionEstablished = true;
				loading = false;
				return;
			}

			// Handle hash fragments (implicit flow - used for password recovery)
			const hash = typeof window !== 'undefined' ? window.location.hash : '';
			if (hash) {
				const hashParams = new URLSearchParams(hash?.startsWith('#') ? hash.slice(1) : hash);
				const accessToken = hashParams.get('access_token');
				const refreshToken = hashParams.get('refresh_token');
				const type = hashParams.get('type');
				const errorDesc = hashParams.get('error_description');

				// Check for errors in hash
				if (errorDesc) {
					err = decodeURIComponent(errorDesc);
					loading = false;
					return;
				}

				if (accessToken && refreshToken && type === 'recovery') {
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
						// Clean up URL
						window.history.replaceState({}, document.title, window.location.pathname);
						return;
					}
				}
			}

			// Handle PKCE flow (query parameter with code) - only if not a PKCE error
			const urlParams = new URLSearchParams(
				typeof window !== 'undefined' ? window.location.search : ''
			);
			const code = urlParams.get('code');
			const errorParam = urlParams.get('error');
			const errorDescParam = urlParams.get('error_description');

			// Check for errors in query params
			if (errorParam || errorDescParam) {
				err = errorDescParam
					? decodeURIComponent(errorDescParam)
					: errorParam || 'An error occurred';
				// If it's a PKCE error, provide helpful message
				if (err.includes('code verifier')) {
					err =
						'Password reset configuration error. Please contact support or try the workaround below.';
				}
				loading = false;
				return;
			}

			if (code) {
				try {
					// Exchange the code for a session
					const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
					if (exchangeError) {
						// If PKCE error, provide helpful message
						if (exchangeError.message?.includes('code verifier')) {
							err =
								'Password reset is misconfigured (PKCE error). Please ask an admin to disable PKCE for password recovery in Supabase Dashboard > Authentication > Settings.';
						} else {
							err =
								exchangeError.message ||
								'Failed to establish recovery session. Please use a fresh link.';
						}
						loading = false;
						return;
					}
					if (data?.session) {
						sessionEstablished = true;
						loading = false;
						// Clean up URL
						window.history.replaceState({}, document.title, window.location.pathname);
						return;
					}
				} catch (e: any) {
					err = e?.message || 'Failed to process reset link.';
					loading = false;
					return;
				}
			}

			// If we get here, no valid session could be established
			err = 'Invalid or expired reset link. Please request a new password reset.';
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
	{:else if err}
		<div class="flex flex-col items-center gap-y-2">
			<p class="text-center text-red-600">{err}</p>
			<details class="text-left text-sm opacity-60">
				<summary class="cursor-pointer">Debug Info</summary>
				<pre class="mt-2 text-xs break-all whitespace-pre-wrap">URL: {typeof window !== 'undefined'
						? window.location.href
						: ''}</pre>
			</details>
			<a class="mt-2 underline" href="/">Back to home</a>
		</div>
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
</section>
