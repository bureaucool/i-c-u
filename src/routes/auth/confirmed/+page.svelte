<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { createSupabaseBrowser } from '$lib/supabaseClient';

	onMount(async () => {
		const supabase = createSupabaseBrowser();

		try {
			const url = new URL(window.location.href);
			const code = url.searchParams.get('code');

			if (code) {
				// Exchange code for a session (PKCE/email links)
				// @ts-ignore – depending on supabase-js version, accepts a string or { code }
				await supabase.auth.exchangeCodeForSession(typeof code === 'string' ? code : { code });
			} else if (window.location.hash) {
				// Fallback: handle access_token/refresh_token in hash
				const hash = new URLSearchParams(window.location.hash.slice(1));
				const access_token = hash.get('access_token');
				const refresh_token = hash.get('refresh_token');
				if (access_token && refresh_token) {
					await supabase.auth.setSession({ access_token, refresh_token });
				}
			}
		} catch (e) {
			// Ignore errors; user can still log in manually if needed
		} finally {
			// Clean up URL and redirect to settings with password prompt
			history.replaceState({}, '', '/auth/confirmed');
			await goto('/settings?prompt_set_password=true');
		}
	});
</script>

<section class="flex min-h-screen flex-col items-center justify-center gap-y-4 p-6 text-center">
	<h1 class="text-3xl">Confirming…</h1>
	<p>Please wait while we finish signing you in.</p>
</section>
