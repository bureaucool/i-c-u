/**
 * Password Reset Endpoint using Supabase OTP (PKCE-free)
 *
 * This uses Supabase's built-in email + OTP verification to bypass PKCE issues:
 * 1. Sends password reset email via Supabase (using OTP, not PKCE)
 * 2. Email contains link with token_hash
 * 3. Server verifies OTP and allows password update
 *
 * Email template should use: {{ .TokenHash }} instead of {{ .ConfirmationURL }}
 */

import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, PUBLIC_APP_URL } from '$env/static/public';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const email = typeof body.email === 'string' ? body.email.trim() : '';
	if (!email) throw error(400, 'email required');

	const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			get: (key) => cookies.get(key),
			set: (key, value, options) => cookies.set(key, value, { path: '/', ...options }),
			remove: (key, options) => cookies.delete(key, { path: '/', ...options })
		}
	});

	const appBase = PUBLIC_APP_URL || 'http://localhost:5173';
	// Point to our server-side confirm endpoint instead of client-side page
	const redirectTo = `${appBase}/api/auth/confirm`;

	// Use Supabase's resetPasswordForEmail - this sends an OTP token
	const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo
	});

	if (err) throw error(400, err.message || 'failed to send reset email');
	return json({ ok: true });
};
